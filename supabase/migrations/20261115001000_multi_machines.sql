-- Several machines per partner, each with its own 1–2 discount values (owner, 2026-11-15).
-- Machine IDs and 店No. are assigned automatically when the admin confirms the machine payment.
-- The numbering rules are TEMPORARY until Amano answers (see private.machine_code / private.next_store_no).
alter table public.machines
  add column if not exists machine_no int,
  add column if not exists machine_code text unique,
  add column if not exists discount_codes text[],
  add column if not exists store_nos int[];
alter table public.machines drop constraint if exists machines_discounts_chk;
alter table public.machines add constraint machines_discounts_chk
  check (discount_codes is null or cardinality(discount_codes) between 1 and 2);
create unique index if not exists machines_partner_no on public.machines (partner_id, machine_no) where machine_no is not null;
alter table public.store_numbers add column if not exists machine_id bigint references public.machines (id);

-- ---------------------------------------------------------------- numbering rules (TEMPORARY)
-- Machine ID: partner ID + machine number, e.g. P009-1, P009-2.
create or replace function private.machine_code(p_partner_code text, p_machine_no int) returns text
language sql immutable set search_path = '' as $$ select p_partner_code || '-' || p_machine_no $$;

-- 店No.: the next number not used before (registered or assigned), one per machine × discount value.
create or replace function private.next_store_no() returns int
language sql volatile security definer set search_path = '' as $$
  select greatest(
           coalesce((select max(store_no) from public.store_numbers), 0),
           coalesce((select max(x) from public.machines m, unnest(m.store_nos) x), 0)
         ) + 1
$$;

-- Assign machine numbers, IDs and 店No. to the machines of a paid equipment invoice.
create or replace function private.assign_machine_ids(p_invoice uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record; v_code text; v_no int; d text;
begin
  perform pg_advisory_xact_lock(hashtext('machine_numbering'));
  select p.partner_code into v_code from public.invoices i join public.partners p on p.id = i.partner_id where i.id = p_invoice;
  for r in select * from public.machines where equipment_invoice_id = p_invoice and machine_code is null order by id loop
    select coalesce(max(machine_no), 0) + 1 into v_no from public.machines where partner_id = r.partner_id;
    update public.machines set machine_no = v_no, machine_code = private.machine_code(v_code, v_no), store_nos = '{}' where id = r.id;
    foreach d in array r.discount_codes loop
      update public.machines set store_nos = store_nos || private.next_store_no() where id = r.id;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------- ordering (partner)
-- p_items: [{"discounts": ["1h"]}, {"discounts": ["1h", "3h"]}, …] — 1 to 5 machines.
create or replace function public.order_validation_machines(p_items jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid := private.my_partner_id();
  v_status text;
  v_price public.price_list;
  v_id uuid;
  v_n int;
  v_total int;
  it jsonb;
  v_codes text[];
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  select status into v_status from public.partners where id = v_partner for update;
  if v_status not in ('approved', 'active') then raise exception 'machines cannot be ordered now (status %)', v_status; end if;
  if exists (select 1 from public.invoices where partner_id = v_partner and kind = 'equipment' and status in ('draft', 'approved', 'published')) then
    raise exception 'there is already an unpaid machine order';
  end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'invalid order'; end if;
  v_n := jsonb_array_length(p_items);
  if v_n not between 1 and 5 then raise exception 'order 1 to 5 machines'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select array_agg(x) into v_codes from jsonb_array_elements_text(it->'discounts') x;
    if v_codes is null or cardinality(v_codes) not between 1 and 2 then raise exception 'each machine needs 1 or 2 discount values'; end if;
    if cardinality(v_codes) = 2 and v_codes[1] = v_codes[2] then raise exception 'the two discount values of a machine must differ'; end if;
    if exists (select 1 from unnest(v_codes) c where c not in (select code from public.discount_types)) then raise exception 'invalid discount type'; end if;
  end loop;
  select * into v_price from public.price_list where code = 'qr_validator';
  v_total := v_price.unit_yen * v_n;
  insert into public.invoices (invoice_no, partner_id, kind, status, total_yen, tax_yen, issued_on, due_on)
  values (public.next_invoice_no('EQ-' || extract(year from v_today)::int), v_partner, 'equipment', 'draft',
          v_total, floor(v_total * 10 / 110.0)::int, v_today, v_today + 30)
  returning id into v_id;
  insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
  values (v_id, v_price.label, v_n, v_price.unit_yen, v_total);
  for it in select * from jsonb_array_elements(p_items) loop
    select array_agg(x) into v_codes from jsonb_array_elements_text(it->'discounts') x;
    insert into public.machines (partner_id, equipment_invoice_id, discount_codes) values (v_partner, v_id, v_codes);
  end loop;
  update public.invoices set status = 'published', published_at = now() where id = v_id;
  if v_status = 'approved' then update public.partners set status = 'awaiting_payment' where id = v_partner; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'order_machines', 'invoice', v_id::text, jsonb_build_object('items', p_items, 'unit', v_price.unit_yen));
  return v_id;
end;
$$;
revoke all on function public.order_validation_machines(jsonb) from public, anon;
grant execute on function public.order_validation_machines(jsonb) to authenticated;
revoke execute on function public.order_validation_machine() from authenticated;

-- ---------------------------------------------------------------- payment (admin)
create or replace function public.confirm_bank_payment(p_invoice uuid, p_paid_on date, p_amount int, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices; v_paid int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null or v_inv.status not in ('published', 'paid') then raise exception 'invoice not payable'; end if;
  insert into public.payments (invoice_id, method, amount_yen, paid_on, confirmed_by, note)
  values (p_invoice, 'bank', p_amount, p_paid_on, auth.uid(), p_note);
  select coalesce(sum(amount_yen), 0) into v_paid from public.payments where invoice_id = p_invoice;
  if v_paid >= v_inv.total_yen and v_inv.status = 'published' then
    update public.invoices set status = 'paid' where id = p_invoice;
    if v_inv.kind = 'equipment' then
      perform private.assign_machine_ids(p_invoice);
      update public.partners set status = 'preparing' where id = v_inv.partner_id and status = 'awaiting_payment';
    end if;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'confirm_bank_payment', 'invoice', p_invoice::text, jsonb_build_object('amount', p_amount, 'paid_on', p_paid_on));
end;
$$;

-- ---------------------------------------------------------------- shipment (admin)
-- Ships every paid, numbered, not yet shipped machine of the partner in one parcel / one 納品書.
-- p_serials: {"<machine id>": "<serial number>", …}
drop function if exists public.record_shipment(uuid, text, text, text, date, date);
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
  if not exists (select 1 from public.machines where partner_id = p_partner and machine_code is not null and shipped_on is null) then
    raise exception 'no machine is waiting to be shipped';
  end if;
  v_dn := public.next_invoice_no('DN-' || extract(year from p_shipped_on)::int);
  for r in select * from public.machines where partner_id = p_partner and machine_code is not null and shipped_on is null order by machine_no loop
    update public.machines
       set serial_no = nullif(trim(p_serials->>(r.id::text)), ''), shipped_on = p_shipped_on,
           carrier = nullif(trim(p_carrier), ''), tracking_no = nullif(trim(p_tracking), ''), delivery_note_no = v_dn,
           received_on = p_received_on, warranty_until = (p_received_on + interval '1 year' - interval '1 day')::date
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
revoke all on function public.record_shipment(uuid, jsonb, text, text, date, date) from public, anon;
grant execute on function public.record_shipment(uuid, jsonb, text, text, date, date) to authenticated;

-- ---------------------------------------------------------------- existing paid orders without machine rows
do $$
declare inv record; k int;
begin
  for inv in
    select i.id, i.partner_id, l.quantity, p.requested_discounts
      from public.invoices i
      join public.invoice_lines l on l.invoice_id = i.id
      join public.partners p on p.id = i.partner_id
     where i.kind = 'equipment' and i.status = 'paid' and p.status = 'preparing'
       and not exists (select 1 from public.machines m where m.equipment_invoice_id = i.id)
  loop
    for k in 1 .. inv.quantity loop
      insert into public.machines (partner_id, equipment_invoice_id, discount_codes)
      values (inv.partner_id, inv.id, coalesce(inv.requested_discounts, array['1h']));
    end loop;
    perform private.assign_machine_ids(inv.id);
  end loop;
end $$;
