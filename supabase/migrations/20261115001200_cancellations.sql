-- Machine order cancellations (owner, 2026-11-15): accepted only while the order has not been
-- sent to Amano. Whole orders (one machine invoice) are cancelled.
--  * Unpaid: the partner cancels it in the portal (invoice → cancelled).
--  * Paid: the admin cancels it and records the refund → cancellation invoice (赤伝) CN-YYYY-NNNNNN,
--    original invoice → cancelled, refund recorded. Issued invoices are never changed or deleted.
alter table public.machines
  add column if not exists amano_ordered_on date,     -- setup request sent to Amano: no cancellation after this
  add column if not exists cancelled_at timestamptz;

create table if not exists public.refunds (
  id bigint generated always as identity primary key,
  invoice_id uuid not null references public.invoices (id),
  amount_yen int not null check (amount_yen > 0),
  refunded_on date not null,
  method text not null default 'bank' check (method in ('bank', 'card')),
  confirmed_by uuid,
  note text,
  created_at timestamptz not null default now()
);
alter table public.refunds enable row level security;
drop policy if exists refunds_select on public.refunds;
create policy refunds_select on public.refunds for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.invoices i where i.id = invoice_id and i.partner_id = (select private.my_partner_id())));
revoke all on public.refunds from anon;

-- Partner status after an order disappears: back to 承認済み when nothing else is pending or shipped.
create or replace function private.settle_partner_status(p_partner uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.partners p set status = 'approved'
   where p.id = p_partner and p.status in ('awaiting_payment', 'preparing')
     and not exists (select 1 from public.machines m where m.partner_id = p_partner and m.cancelled_at is null);
end;
$$;

-- Admin: the setup request for the waiting machines was sent to Amano.
create or replace function public.mark_amano_ordered(p_partner uuid, p_date date) returns int
language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.machines set amano_ordered_on = coalesce(p_date, (now() at time zone 'Asia/Tokyo')::date)
   where partner_id = p_partner and machine_code is not null and shipped_on is null
     and cancelled_at is null and amano_ordered_on is null;
  get diagnostics v_n = row_count;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'mark_amano_ordered', 'partner', p_partner::text, jsonb_build_object('date', p_date, 'machines', v_n));
  return v_n;
end;
$$;

-- Partner: cancel an unpaid machine order.
create or replace function public.cancel_my_machine_order(p_invoice uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id(); v_inv public.invoices;
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  select * into v_inv from public.invoices where id = p_invoice and partner_id = v_partner for update;
  if v_inv.id is null or v_inv.kind <> 'equipment' then raise exception 'order not found'; end if;
  if v_inv.status <> 'published' then raise exception 'only unpaid orders can be cancelled here'; end if;
  if exists (select 1 from public.payments where invoice_id = p_invoice) then
    raise exception 'a payment has already been received; please ask us to cancel';
  end if;
  update public.invoices set status = 'cancelled' where id = p_invoice;
  update public.machines set cancelled_at = now() where equipment_invoice_id = p_invoice and cancelled_at is null;
  perform private.settle_partner_status(v_partner);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'cancel_machine_order', 'invoice', p_invoice::text, jsonb_build_object('by', 'partner', 'invoice_no', v_inv.invoice_no));
end;
$$;

-- Admin: cancel a machine order not yet sent to Amano. A paid order needs the refund (date, amount).
create or replace function public.cancel_machine_order(p_invoice uuid, p_refunded_on date, p_refund_yen int, p_note text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices; v_paid int; v_cn uuid; v_cn_no text; v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null or v_inv.kind <> 'equipment' or v_inv.status not in ('published', 'paid') then
    raise exception 'order not found or already cancelled';
  end if;
  if exists (select 1 from public.machines where equipment_invoice_id = p_invoice
             and (amano_ordered_on is not null or shipped_on is not null)) then
    raise exception 'this order has already been sent to Amano and cannot be cancelled';
  end if;
  select coalesce(sum(amount_yen), 0) into v_paid from public.payments where invoice_id = p_invoice;
  if v_paid > 0 then
    if p_refunded_on is null or coalesce(p_refund_yen, 0) <= 0 then raise exception 'enter the refund date and amount'; end if;
    insert into public.refunds (invoice_id, amount_yen, refunded_on, confirmed_by, note)
    values (p_invoice, p_refund_yen, p_refunded_on, auth.uid(), p_note);
  end if;
  if v_inv.status = 'paid' then
    v_cn_no := public.next_invoice_no('CN-' || extract(year from v_today)::int);
    insert into public.invoices (invoice_no, partner_id, kind, status, total_yen, tax_yen, issued_on, cancels_invoice_id)
    values (v_cn_no, v_inv.partner_id, 'cancellation', 'draft', -v_inv.total_yen, -v_inv.tax_yen, v_today, p_invoice)
    returning id into v_cn;
    insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
    select v_cn, description, quantity, -unit_yen, -amount_yen from public.invoice_lines where invoice_id = p_invoice;
    update public.invoices set status = 'paid', published_at = now() where id = v_cn;
  end if;
  update public.invoices set status = 'cancelled' where id = p_invoice;
  update public.machines set cancelled_at = now() where equipment_invoice_id = p_invoice and cancelled_at is null;
  perform private.settle_partner_status(v_inv.partner_id);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'cancel_machine_order', 'invoice', p_invoice::text,
          jsonb_build_object('by', 'admin', 'invoice_no', v_inv.invoice_no, 'refund', p_refund_yen, 'refunded_on', p_refunded_on,
                             'cancellation_invoice', v_cn_no, 'note', p_note));
  return v_cn_no;
end;
$$;

-- Numbering and shipping ignore cancelled machines.
create or replace function private.assign_machine_ids(p_invoice uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record; v_code text; v_no int; d text;
begin
  perform pg_advisory_xact_lock(hashtext('machine_numbering'));
  select p.partner_code into v_code from public.invoices i join public.partners p on p.id = i.partner_id where i.id = p_invoice;
  for r in select * from public.machines where equipment_invoice_id = p_invoice and machine_code is null and cancelled_at is null order by id loop
    select coalesce(max(machine_no), 0) + 1 into v_no from public.machines where partner_id = r.partner_id;
    update public.machines set machine_no = v_no, machine_code = private.machine_code(v_code, v_no), store_nos = '{}' where id = r.id;
    foreach d in array r.discount_codes loop
      update public.machines set store_nos = store_nos || private.next_store_no() where id = r.id;
    end loop;
  end loop;
end;
$$;

create or replace function public.record_shipment(p_partner uuid, p_serials jsonb, p_carrier text, p_tracking text,
                                                  p_shipped_on date, p_received_on date)
returns int language plpgsql security definer set search_path = '' as $$
declare v_dn text; r record; i int; v_count int := 0; v_status text;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select status into v_status from public.partners where id = p_partner for update;
  if v_status not in ('preparing', 'active') then raise exception 'partner is not waiting for a machine'; end if;
  if p_received_on is null then raise exception 'enter the date Amano delivered the machine'; end if;
  if p_received_on > p_shipped_on then raise exception 'the Amano delivery date cannot be after the shipping date'; end if;
  if not exists (select 1 from public.machines where partner_id = p_partner and machine_code is not null and shipped_on is null and cancelled_at is null) then
    raise exception 'no machine is waiting to be shipped';
  end if;
  v_dn := public.next_invoice_no('DN-' || extract(year from p_shipped_on)::int);
  for r in select * from public.machines where partner_id = p_partner and machine_code is not null and shipped_on is null and cancelled_at is null order by machine_no loop
    update public.machines
       set serial_no = nullif(trim(p_serials->>(r.id::text)), ''), shipped_on = p_shipped_on,
           carrier = nullif(trim(p_carrier), ''), tracking_no = nullif(trim(p_tracking), ''), delivery_note_no = v_dn,
           received_on = p_received_on, warranty_until = (p_received_on + interval '1 year' - interval '1 day')::date,
           amano_ordered_on = coalesce(amano_ordered_on, p_received_on)
     where id = r.id;
    for i in 1 .. cardinality(r.discount_codes) loop
      insert into public.store_numbers (store_no, partner_id, discount_code, valid_from, machine_id, note)
      values (r.store_nos[i], p_partner, r.discount_codes[i], p_shipped_on, r.id, r.machine_code);
    end loop;
    v_count := v_count + 1;
  end loop;
  update public.partners set status = 'active', active_from = coalesce(active_from, p_shipped_on) where id = p_partner and status = 'preparing';
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'record_shipment', 'partner', p_partner::text,
          jsonb_build_object('serials', p_serials, 'carrier', p_carrier, 'tracking', p_tracking, 'shipped_on', p_shipped_on,
                             'received_on', p_received_on, 'delivery_note', v_dn, 'machines', v_count));
  return v_count;
end;
$$;

revoke all on function public.mark_amano_ordered(uuid, date) from public, anon;
grant execute on function public.mark_amano_ordered(uuid, date) to authenticated;
revoke all on function public.cancel_my_machine_order(uuid) from public, anon;
grant execute on function public.cancel_my_machine_order(uuid) to authenticated;
revoke all on function public.cancel_machine_order(uuid, date, int, text) from public, anon;
grant execute on function public.cancel_machine_order(uuid, date, int, text) to authenticated;
