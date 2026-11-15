-- Monthly invoices (owner, 2026-11-16).
--  * Closing day: end of month. Drafts for the previous month are created after the first ParkingWeb
--    import of the month that contains data up to the end of that month.
--  * Due date: the 25th of the issue month, or the closest working day (weekends, Japanese public
--    holidays and 鈴江's own holidays are not working days) — computed by the website (lib/holidays.js).
--  * "Publish automatically" on: drafts are published at once with the draft date as issue date.
--    Off: the admin presses 「すべて公開」; the issue date is that day.
--  * Months with zero validations: no invoice.
--  * Draft invoices carry a temporary number (DRAFT-…); the gap-free number INV-YYYY-NNNNNN is given
--    when the invoice is published. Partners never see drafts (RLS).

create table if not exists public.billing_settings (
  id int primary key default 1 check (id = 1),
  auto_publish boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.billing_settings (id) values (1) on conflict do nothing;
alter table public.billing_settings enable row level security;
drop policy if exists billing_settings_admin on public.billing_settings;
create policy billing_settings_admin on public.billing_settings for select to authenticated using ((select private.is_admin()));
revoke all on public.billing_settings from anon;
revoke insert, update, delete on public.billing_settings from authenticated;

create table if not exists public.company_holidays (
  day date primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table public.company_holidays enable row level security;
drop policy if exists company_holidays_admin on public.company_holidays;
create policy company_holidays_admin on public.company_holidays for select to authenticated using ((select private.is_admin()));
revoke all on public.company_holidays from anon;
revoke insert, update, delete on public.company_holidays from authenticated;

create table if not exists public.billing_runs (
  month date primary key check (month = date_trunc('month', month)::date),
  drafted_at timestamptz not null default now(),
  drafts int not null default 0,
  import_run_id bigint references public.import_runs (id),
  published_at timestamptz,
  auto boolean not null default false
);
alter table public.billing_runs enable row level security;
drop policy if exists billing_runs_admin on public.billing_runs;
create policy billing_runs_admin on public.billing_runs for select to authenticated using ((select private.is_admin()));
revoke all on public.billing_runs from anon;
revoke insert, update, delete on public.billing_runs from authenticated;

create or replace function private.admin_or_service() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select private.is_admin()) or coalesce((select auth.role()), '') = 'service_role'
$$;

-- Settings and holidays (admin).
create or replace function public.set_auto_publish(p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.billing_settings set auto_publish = coalesce(p_on, false), updated_at = now(), updated_by = auth.uid() where id = 1;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'set_auto_publish', 'billing_settings', '1', jsonb_build_object('on', p_on));
end;
$$;

create or replace function public.add_company_holiday(p_day date, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  insert into public.company_holidays (day, note) values (p_day, nullif(trim(p_note), ''))
  on conflict (day) do update set note = excluded.note;
end;
$$;

create or replace function public.remove_company_holiday(p_day date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  delete from public.company_holidays where day = p_day;
end;
$$;

-- Create the draft invoices of one month (idempotent: nothing happens if the month was drafted).
create or replace function public.create_monthly_drafts(p_month date, p_issued date, p_due date, p_import_run bigint)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month')::date;
  r record; l record;
  v_inv uuid; v_n int; v_gross int; v_rate numeric; v_total int; v_disc int; v_count int := 0;
begin
  if not private.admin_or_service() then raise exception 'admin only'; end if;
  perform pg_advisory_xact_lock(hashtext('monthly_drafts'));
  if exists (select 1 from public.billing_runs where month = v_month) then return 0; end if;

  for r in
    select distinct p.id, p.partner_code from public.partners p
      join public.store_numbers sn on sn.partner_id = p.id
     where sn.valid_from < v_end and (sn.valid_to is null or sn.valid_to > v_month)
       and not exists (select 1 from public.invoices i where i.partner_id = p.id and i.kind = 'monthly'
                        and i.period_month = v_month and i.status <> 'cancelled')
     order by p.partner_code
  loop
    select c.validation_count, c.gross_yen, c.volume_rate, c.total_yen into v_n, v_gross, v_rate, v_total
      from public.monthly_charge(r.id, v_month) c;
    if coalesce(v_n, 0) = 0 then continue; end if;   -- no validations: no invoice
    insert into public.invoices (invoice_no, partner_id, kind, period_month, status, validation_count, gross_yen,
                                 volume_rate, total_yen, tax_yen, issued_on, due_on)
    values ('DRAFT-' || replace(gen_random_uuid()::text, '-', ''), r.id, 'monthly', v_month, 'draft', v_n, v_gross,
            v_rate, v_total, floor(v_total * 10 / 110.0)::int, p_issued, p_due)
    returning id into v_inv;
    -- One line per discount value (price per validation fixed at billing time), then the volume discount.
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
      values (v_inv, '駐車割引認証（' || l.hours || '時間無料）', l.code, l.qty, l.unit_yen, l.qty * l.unit_yen);
    end loop;
    v_disc := v_gross - v_total;
    if v_disc > 0 then
      insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
      values (v_inv, '数量割引（' || v_n || '件・' || round(v_rate * 100)::int || '%）', 1, -v_disc, -v_disc);
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

-- Remove the month's drafts so they can be created again (e.g. after a correcting import).
create or replace function public.discard_monthly_drafts(p_month date) returns int
language plpgsql security definer set search_path = '' as $$
declare v_month date := date_trunc('month', p_month)::date; v_n int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
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

-- Publish drafts of one month (all, or only p_ids) with the given issue and due dates.
-- Gap-free numbers INV-YYYY-NNNNNN in partner ID order. Returns the published invoice ids.
create or replace function public.publish_monthly_invoices(p_month date, p_issued date, p_due date, p_ids uuid[])
returns setof uuid language plpgsql security definer set search_path = '' as $$
declare v_month date := date_trunc('month', p_month)::date; r record; v_auto boolean;
begin
  if not private.admin_or_service() then raise exception 'admin only'; end if;
  if p_issued is null or p_due is null then raise exception 'issue and due dates are required'; end if;
  perform pg_advisory_xact_lock(hashtext('monthly_publish'));
  for r in
    select i.id from public.invoices i join public.partners p on p.id = i.partner_id
     where i.kind = 'monthly' and i.period_month = v_month and i.status = 'draft'
       and (p_ids is null or i.id = any (p_ids))
     order by p.partner_code
     for update of i
  loop
    update public.invoices
       set invoice_no = public.next_invoice_no('INV-' || extract(year from p_issued)::int),
           status = 'published', published_at = now(), issued_on = p_issued, due_on = p_due,
           approved_by = auth.uid(), approved_at = now()
     where id = r.id;
    return next r.id;
  end loop;
  v_auto := coalesce((select auth.role()), '') = 'service_role';
  update public.billing_runs set published_at = coalesce(published_at, now()), auto = v_auto where month = v_month;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'publish_monthly_invoices', 'billing_run', v_month::text,
          jsonb_build_object('issued', p_issued, 'due', p_due, 'only', p_ids, 'auto', v_auto));
end;
$$;

revoke all on function private.admin_or_service() from public, anon;
grant execute on function private.admin_or_service() to authenticated, service_role;
revoke all on function public.set_auto_publish(boolean) from public, anon;
revoke all on function public.add_company_holiday(date, text) from public, anon;
revoke all on function public.remove_company_holiday(date) from public, anon;
revoke all on function public.create_monthly_drafts(date, date, date, bigint) from public, anon;
revoke all on function public.discard_monthly_drafts(date) from public, anon;
revoke all on function public.publish_monthly_invoices(date, date, date, uuid[]) from public, anon;
grant execute on function public.set_auto_publish(boolean) to authenticated;
grant execute on function public.add_company_holiday(date, text) to authenticated;
grant execute on function public.remove_company_holiday(date) to authenticated;
grant execute on function public.create_monthly_drafts(date, date, date, bigint) to authenticated, service_role;
grant execute on function public.discard_monthly_drafts(date) to authenticated;
grant execute on function public.publish_monthly_invoices(date, date, date, uuid[]) to authenticated, service_role;

-- Checks shown before publishing a month: days without any validation (missing import?) and
-- 店No. with validations that belong to no partner (not billed).
create or replace function public.billing_checks(p_month date)
returns table (missing_days date[], unknown_stores int[])
language sql stable security definer set search_path = '' as $$
  with m as (select date_trunc('month', p_month)::date as a, (date_trunc('month', p_month) + interval '1 month')::date as b),
  days as (select distinct (v.paid_at at time zone 'Asia/Tokyo')::date d from public.validations v, m
            where (v.paid_at at time zone 'Asia/Tokyo') >= m.a and (v.paid_at at time zone 'Asia/Tokyo') < m.b)
  select
    (select coalesce(array_agg(g::date order by g), '{}') from m, generate_series(m.a, m.b - 1, interval '1 day') g
      where g::date not in (select d from days)),
    (select coalesce(array_agg(distinct v.store_no order by v.store_no), '{}') from public.validations v, m
      where (v.paid_at at time zone 'Asia/Tokyo') >= m.a and (v.paid_at at time zone 'Asia/Tokyo') < m.b
        and not exists (select 1 from public.store_numbers s where s.store_no = v.store_no
                         and (v.paid_at at time zone 'Asia/Tokyo')::date >= s.valid_from
                         and (s.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < s.valid_to)))
  where (select private.is_admin())
$$;
revoke all on function public.billing_checks(date) from public, anon;
grant execute on function public.billing_checks(date) to authenticated;
