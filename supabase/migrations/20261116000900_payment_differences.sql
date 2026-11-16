-- Payment differences (owner, 2026-11-16), following common Japanese practice:
--  Underpaid (一部入金): 「不足額を請求」 (separate invoice for the shortfall), 「翌月に合算」 (added to next
--  month's invoice) or 「差額を値引き」 (written off by agreement). Overpaid (過入金): 「返金済みにする」
--  (refund made outside the site: date, amount, bank fee, note) or 「翌月に相殺」 (deducted from next
--  month's invoice). Carried amounts are not new sales: they are shown as 対象外 lines and are not
--  included in the 10% tax base of the new invoice (adjust_yen).

alter table public.invoices drop constraint if exists invoices_kind_check;
alter table public.invoices add constraint invoices_kind_check
  check (kind in ('monthly', 'equipment', 'change_fee', 'repair', 'cancellation', 'balance'));
alter table public.invoices
  add column if not exists adjust_yen int not null default 0,          -- part of total_yen outside the tax base
  add column if not exists settlement text check (settlement in ('shortfall_invoiced', 'carried', 'written_off', 'refunded', 'offset')),
  add column if not exists settled_yen int,                            -- shortfall or excess that was settled
  add column if not exists settled_at timestamptz,
  add column if not exists settled_note text,
  add column if not exists settled_ref uuid references public.invoices (id),   -- shortfall invoice / invoice that carried it
  add column if not exists balance_of uuid references public.invoices (id);    -- for kind 'balance': the original invoice
alter table public.invoice_lines add column if not exists tax_exempt boolean not null default false;

create table if not exists public.billing_adjustments (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  source_invoice_id uuid not null references public.invoices (id),
  kind text not null check (kind in ('shortfall', 'excess')),
  amount_yen int not null check (amount_yen > 0),
  applied_yen int not null default 0 check (applied_yen >= 0),
  created_at timestamptz not null default now(),
  created_by uuid
);
alter table public.invoice_lines add column if not exists adjustment_id bigint references public.billing_adjustments (id);
alter table public.billing_adjustments enable row level security;
drop policy if exists billing_adjustments_admin on public.billing_adjustments;
create policy billing_adjustments_admin on public.billing_adjustments for select to authenticated using ((select private.is_admin()));
revoke all on public.billing_adjustments from anon;
revoke insert, update, delete on public.billing_adjustments from authenticated;

-- adjust_yen belongs to the protected fields of an issued invoice.
create or replace function public.protect_issued_invoice() returns trigger
language plpgsql set search_path to '' as $function$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'issued invoices cannot be deleted; issue a cancellation instead'; end if;
    return old;
  end if;
  if old.status <> 'draft' and (
       new.invoice_no, new.partner_id, new.kind, new.period_month, new.total_yen, new.tax_yen, new.adjust_yen,
       new.validation_count, new.gross_yen, new.volume_rate, new.issued_on, new.due_on
     ) is distinct from (
       old.invoice_no, old.partner_id, old.kind, old.period_month, old.total_yen, old.tax_yen, old.adjust_yen,
       old.validation_count, old.gross_yen, old.volume_rate, old.issued_on, old.due_on
     ) then
    raise exception 'issued invoice % cannot be changed', old.invoice_no;
  end if;
  return new;
end;
$function$;

create or replace function private.invoice_paid(p_invoice uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(amount_yen), 0)::int from public.payments where invoice_id = p_invoice
$$;
revoke all on function private.invoice_paid(uuid) from public, anon;
grant execute on function private.invoice_paid(uuid) to authenticated, service_role;

-- Underpaid invoice: p_mode 'invoice' | 'carry' | 'write_off'. Returns the new shortfall invoice id (mode 'invoice').
create or replace function public.settle_shortfall(p_invoice uuid, p_mode text, p_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices; v_paid int; v_short int; v_new uuid;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null or v_inv.status <> 'published' then raise exception 'invoice is not open'; end if;
  v_paid := private.invoice_paid(p_invoice);
  v_short := v_inv.total_yen - v_paid;
  if v_paid <= 0 or v_short <= 0 then raise exception 'only partly paid invoices can be settled this way'; end if;
  if p_mode = 'write_off' and coalesce(trim(p_note), '') = '' then raise exception 'please enter a note (e.g. the agreement with the partner)'; end if;

  if p_mode = 'invoice' then
    insert into public.invoices (invoice_no, partner_id, kind, status, total_yen, tax_yen, adjust_yen, balance_of)
    values ('DRAFT-' || replace(gen_random_uuid()::text, '-', ''), v_inv.partner_id, 'balance', 'draft', v_short, 0, v_short, p_invoice)
    returning id into v_new;
    insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen, tax_exempt)
    values (v_new, '請求書 ' || v_inv.invoice_no || ' の不足額', 1, v_short, v_short, true);
    update public.invoices set status = 'paid', settlement = 'shortfall_invoiced', settled_yen = v_short,
           settled_at = now(), settled_note = nullif(trim(p_note), ''), settled_ref = v_new where id = p_invoice;
  elsif p_mode = 'carry' then
    insert into public.billing_adjustments (partner_id, source_invoice_id, kind, amount_yen, created_by)
    values (v_inv.partner_id, p_invoice, 'shortfall', v_short, auth.uid());
    update public.invoices set status = 'paid', settlement = 'carried', settled_yen = v_short,
           settled_at = now(), settled_note = nullif(trim(p_note), '') where id = p_invoice;
  elsif p_mode = 'write_off' then
    update public.invoices set status = 'paid', settlement = 'written_off', settled_yen = v_short,
           settled_at = now(), settled_note = trim(p_note) where id = p_invoice;
  else
    raise exception 'unknown mode';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'settle_shortfall', 'invoice', p_invoice::text,
          jsonb_build_object('mode', p_mode, 'shortfall', v_short, 'note', p_note, 'new_invoice', v_new));
  return v_new;
end;
$$;

-- Overpaid invoice: p_mode 'refund' (with date, amount, fee, note) | 'offset'.
create or replace function public.settle_excess(p_invoice uuid, p_mode text, p_refunded_on date, p_amount int, p_fee int, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices; v_excess int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  v_excess := private.invoice_paid(p_invoice) - v_inv.total_yen;
  if v_inv.id is null or v_inv.status <> 'paid' or v_inv.settlement is not null or v_excess <= 0 then
    raise exception 'there is no open overpayment on this invoice';
  end if;
  if p_mode = 'refund' then
    if p_refunded_on is null or p_refunded_on > (now() at time zone 'Asia/Tokyo')::date then raise exception 'the refund date cannot be in the future'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > v_excess then raise exception 'the refunded amount must be between 1 and the overpayment'; end if;
    if coalesce(p_fee, 0) < 0 or p_amount + coalesce(p_fee, 0) > v_excess then raise exception 'refund plus bank fee cannot exceed the overpayment'; end if;
    insert into public.refunds (invoice_id, amount_yen, refunded_on, method, confirmed_by, note)
    values (p_invoice, p_amount, p_refunded_on, 'bank', auth.uid(),
            concat_ws(' / ', case when coalesce(p_fee, 0) > 0 then '振込手数料 ' || p_fee || '円' end, nullif(trim(p_note), '')));
    update public.invoices set settlement = 'refunded', settled_yen = v_excess, settled_at = now(),
           settled_note = nullif(trim(p_note), '') where id = p_invoice;
  elsif p_mode = 'offset' then
    insert into public.billing_adjustments (partner_id, source_invoice_id, kind, amount_yen, created_by)
    values (v_inv.partner_id, p_invoice, 'excess', v_excess, auth.uid());
    update public.invoices set settlement = 'offset', settled_yen = v_excess, settled_at = now(),
           settled_note = nullif(trim(p_note), '') where id = p_invoice;
  else
    raise exception 'unknown mode';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'settle_excess', 'invoice', p_invoice::text,
          jsonb_build_object('mode', p_mode, 'excess', v_excess, 'refunded', p_amount, 'fee', p_fee, 'on', p_refunded_on, 'note', p_note));
end;
$$;

-- Publish a shortfall invoice (kind 'balance') with its number, issue and due dates.
create or replace function public.publish_balance_invoice(p_id uuid, p_issued date, p_due date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.invoices
     set invoice_no = public.next_invoice_no('INV-' || extract(year from p_issued)::int),
         status = 'published', published_at = now(), issued_on = p_issued, due_on = p_due,
         approved_by = auth.uid(), approved_at = now()
   where id = p_id and kind = 'balance' and status = 'draft';
  if not found then raise exception 'draft not found'; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'publish_balance_invoice', 'invoice', p_id::text, jsonb_build_object('issued', p_issued, 'due', p_due));
end;
$$;

-- Discard a shortfall draft: the original invoice goes back to 一部入金.
create or replace function public.discard_balance_invoice(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_orig uuid;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select balance_of into v_orig from public.invoices where id = p_id and kind = 'balance' and status = 'draft';
  if v_orig is null then raise exception 'draft not found'; end if;
  update public.invoices set status = 'published', settlement = null, settled_yen = null, settled_at = null,
         settled_note = null, settled_ref = null where id = v_orig;
  delete from public.invoices where id = p_id;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'discard_balance_invoice', 'invoice', v_orig::text, '{}'::jsonb);
end;
$$;

-- Monthly drafts now also carry pending shortfalls (added) and overpayments (deducted, never below 0).
create or replace function public.create_monthly_drafts(p_month date, p_issued date, p_due date, p_import_run bigint)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month')::date;
  r record; l record; a record;
  v_inv uuid; v_n int; v_gross int; v_rate numeric; v_total int; v_disc int; v_count int := 0;
  v_adj int; v_take int; v_short int; v_excess int;
begin
  if not private.admin_or_service() then raise exception 'admin only'; end if;
  perform pg_advisory_xact_lock(hashtext('monthly_drafts'));
  if exists (select 1 from public.billing_runs where month = v_month) then return 0; end if;

  for r in
    select p.id, p.partner_code from public.partners p
     where (exists (select 1 from public.store_numbers sn where sn.partner_id = p.id
                     and sn.valid_from < v_end and (sn.valid_to is null or sn.valid_to > v_month))
            or exists (select 1 from public.billing_adjustments ba where ba.partner_id = p.id and ba.kind = 'shortfall'
                        and ba.applied_yen < ba.amount_yen))
       and not exists (select 1 from public.invoices i where i.partner_id = p.id and i.kind = 'monthly'
                        and i.period_month = v_month and i.status <> 'cancelled')
     order by p.partner_code
  loop
    select c.validation_count, c.gross_yen, c.volume_rate, c.total_yen into v_n, v_gross, v_rate, v_total
      from public.monthly_charge(r.id, v_month) c;
    v_n := coalesce(v_n, 0); v_total := coalesce(v_total, 0); v_gross := coalesce(v_gross, 0);
    select coalesce(sum(amount_yen - applied_yen), 0) into v_short from public.billing_adjustments
     where partner_id = r.id and kind = 'shortfall' and applied_yen < amount_yen;
    if v_n = 0 and v_short = 0 then continue; end if;   -- nothing to bill

    insert into public.invoices (invoice_no, partner_id, kind, period_month, status, validation_count, gross_yen,
                                 volume_rate, total_yen, tax_yen, issued_on, due_on)
    values ('DRAFT-' || replace(gen_random_uuid()::text, '-', ''), r.id, 'monthly', v_month, 'draft', v_n, v_gross,
            coalesce(v_rate, 0), v_total, floor(v_total * 10 / 110.0)::int, p_issued, p_due)
    returning id into v_inv;
    for l in
      select d.code, d.hours, d.unit_yen, sum(v.quantity)::int as qty
        from public.validations v
        join public.store_numbers sn on sn.store_no = v.store_no
         and (v.paid_at at time zone 'Asia/Tokyo')::date >= sn.valid_from
         and (sn.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < sn.valid_to)
        join public.discount_types d on d.code = sn.discount_code
       where sn.partner_id = r.id and not v.excluded
         and (v.paid_at at time zone 'Asia/Tokyo') >= v_month
         and (v.paid_at at time zone 'Asia/Tokyo') < v_end
       group by d.code, d.hours, d.unit_yen
       order by d.hours
    loop
      insert into public.invoice_lines (invoice_id, description, discount_code, quantity, unit_yen, amount_yen)
      values (v_inv, '駐車場利用料金（' || l.hours || '時間）', l.code, l.qty, l.unit_yen, l.qty * l.unit_yen);
    end loop;
    v_disc := v_gross - v_total;
    if v_disc > 0 then
      insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
      values (v_inv, '数量割引（' || v_n || '件・' || round(v_rate * 100)::int || '%）', 1, -v_disc, -v_disc);
    end if;

    -- Carried amounts (対象外, outside the tax base)
    v_adj := 0;
    for a in select ba.*, i.invoice_no from public.billing_adjustments ba join public.invoices i on i.id = ba.source_invoice_id
              where ba.partner_id = r.id and ba.kind = 'shortfall' and ba.applied_yen < ba.amount_yen order by ba.id loop
      v_take := a.amount_yen - a.applied_yen;
      insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen, tax_exempt, adjustment_id)
      values (v_inv, '前回ご請求の不足額（' || a.invoice_no || '）', 1, v_take, v_take, true, a.id);
      update public.billing_adjustments set applied_yen = applied_yen + v_take where id = a.id;
      v_adj := v_adj + v_take;
    end loop;
    v_excess := v_total + v_adj;   -- what can still be offset (never below 0)
    for a in select ba.*, i.invoice_no from public.billing_adjustments ba join public.invoices i on i.id = ba.source_invoice_id
              where ba.partner_id = r.id and ba.kind = 'excess' and ba.applied_yen < ba.amount_yen order by ba.id loop
      exit when v_excess <= 0;
      v_take := least(a.amount_yen - a.applied_yen, v_excess);
      insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen, tax_exempt, adjustment_id)
      values (v_inv, '前回お支払いの過入金分（' || a.invoice_no || '）', 1, -v_take, -v_take, true, a.id);
      update public.billing_adjustments set applied_yen = applied_yen + v_take where id = a.id;
      v_adj := v_adj - v_take;
      v_excess := v_excess - v_take;
    end loop;
    if v_adj <> 0 then
      update public.invoices set total_yen = v_total + v_adj, adjust_yen = v_adj where id = v_inv;
    end if;
    v_count := v_count + 1;
  end loop;

  insert into public.billing_runs (month, drafts, import_run_id) values (v_month, v_count, p_import_run);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'create_monthly_drafts', 'billing_run', v_month::text,
          jsonb_build_object('drafts', v_count, 'issued', p_issued, 'due', p_due, 'import_run', p_import_run));
  return v_count;
end;
$$;

-- Discarding drafts gives carried amounts back, so they are applied again when drafts are recreated.
create or replace function public.discard_monthly_drafts(p_month date) returns int
language plpgsql security definer set search_path = '' as $$
declare v_month date := date_trunc('month', p_month)::date; v_n int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.billing_adjustments ba set applied_yen = ba.applied_yen - x.amt
    from (select l.adjustment_id, sum(abs(l.amount_yen))::int amt from public.invoice_lines l
            join public.invoices i on i.id = l.invoice_id
           where i.kind = 'monthly' and i.period_month = v_month and i.status = 'draft' and l.adjustment_id is not null
           group by l.adjustment_id) x
   where ba.id = x.adjustment_id;
  delete from public.invoices where kind = 'monthly' and period_month = v_month and status = 'draft';
  get diagnostics v_n = row_count;
  if not exists (select 1 from public.invoices where kind = 'monthly' and period_month = v_month) then
    delete from public.billing_runs where month = v_month;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'discard_monthly_drafts', 'billing_run', v_month::text, jsonb_build_object('removed', v_n));
  return v_n;
end;
$$;

revoke all on function public.settle_shortfall(uuid, text, text) from public, anon;
revoke all on function public.settle_excess(uuid, text, date, int, int, text) from public, anon;
revoke all on function public.publish_balance_invoice(uuid, date, date) from public, anon;
revoke all on function public.discard_balance_invoice(uuid) from public, anon;
grant execute on function public.settle_shortfall(uuid, text, text) to authenticated;
grant execute on function public.settle_excess(uuid, text, date, int, int, text) to authenticated;
grant execute on function public.publish_balance_invoice(uuid, date, date) to authenticated;
grant execute on function public.discard_balance_invoice(uuid) to authenticated;
