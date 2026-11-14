-- Hardening after the Supabase security/performance advisors:
-- * helper functions move to a schema that is not exposed through the API
-- * the partner view becomes a function (no security-definer view)
-- * imports run only with the server key
-- * admin write policies no longer duplicate SELECT; FK indexes added

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function private.my_partner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select partner_id from public.profiles where id = (select auth.uid());
$$;

revoke all on function private.is_admin(), private.my_partner_id() from public, anon;
grant execute on function private.is_admin(), private.my_partner_id() to authenticated, service_role;

-- ---- policies: recreate on the private helpers, SELECT separate from admin writes
drop policy partners_read on public.partners;
drop policy partners_admin_write on public.partners;
drop policy profiles_read on public.profiles;
drop policy profiles_admin_write on public.profiles;
drop policy store_numbers_read on public.store_numbers;
drop policy store_numbers_admin_write on public.store_numbers;
drop policy import_runs_admin on public.import_runs;
drop policy validations_admin on public.validations;
drop policy invoices_read on public.invoices;
drop policy invoices_admin_write on public.invoices;
drop policy invoice_lines_read on public.invoice_lines;
drop policy invoice_lines_admin_write on public.invoice_lines;
drop policy payments_read on public.payments;
drop policy payments_admin_write on public.payments;
drop policy audit_admin on public.audit_log;

do $$
declare t text;
begin
  foreach t in array array['partners','profiles','store_numbers','import_runs','validations','invoices','invoice_lines','payments'] loop
    execute format('create policy %1$s_admin_insert on public.%1$s for insert to authenticated with check ((select private.is_admin()))', t);
    execute format('create policy %1$s_admin_update on public.%1$s for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy %1$s_admin_delete on public.%1$s for delete to authenticated using ((select private.is_admin()))', t);
  end loop;
end $$;

create policy partners_select on public.partners for select to authenticated
  using (id = (select private.my_partner_id()) or (select private.is_admin()));
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy store_numbers_select on public.store_numbers for select to authenticated
  using (partner_id = (select private.my_partner_id()) or (select private.is_admin()));
create policy import_runs_select on public.import_runs for select to authenticated
  using ((select private.is_admin()));
create policy validations_select on public.validations for select to authenticated
  using ((select private.is_admin()));
create policy invoices_select on public.invoices for select to authenticated
  using ((select private.is_admin())
         or (partner_id = (select private.my_partner_id()) and status in ('published','paid','cancelled')));
create policy invoice_lines_select on public.invoice_lines for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id
                 and ((select private.is_admin())
                      or (i.partner_id = (select private.my_partner_id()) and i.status in ('published','paid','cancelled')))));
create policy payments_select on public.payments for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.invoices i where i.id = invoice_id and i.partner_id = (select private.my_partner_id())));
create policy audit_select on public.audit_log for select to authenticated using ((select private.is_admin()));

-- ---- partner usage: a function instead of a security-definer view
drop view public.partner_validations;

create or replace function public.my_validations(p_from date, p_to date)
returns table (id bigint, store_no int, discount_label text, unit_yen int, paid_at timestamptz, entered_at timestamptz, quantity int)
language sql stable security definer set search_path = '' as $$
  select v.id, v.store_no, d.label, d.unit_yen, v.paid_at, v.entered_at, v.quantity
  from public.validations v
  join public.store_numbers sn
    on sn.store_no = v.store_no
   and (v.paid_at at time zone 'Asia/Tokyo')::date >= sn.valid_from
   and (sn.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < sn.valid_to)
  join public.discount_types d on d.code = sn.discount_code
  where not v.excluded
    and sn.partner_id = (select private.my_partner_id())
    and (v.paid_at at time zone 'Asia/Tokyo')::date >= p_from
    and (v.paid_at at time zone 'Asia/Tokyo')::date < p_to
  order by v.paid_at;
$$;
revoke all on function public.my_validations(date, date) from public, anon;
grant execute on function public.my_validations(date, date) to authenticated;

-- ---- monthly charge: same rules, private helpers
create or replace function public.monthly_charge(p_partner uuid, p_month date)
returns table (validation_count int, gross_yen int, volume_rate numeric, total_yen int)
language sql stable security definer set search_path = '' as $$
  with usage as (
    select coalesce(sum(v.quantity), 0)::int as n,
           coalesce(sum(v.quantity * d.unit_yen), 0)::int as gross
    from public.validations v
    join public.store_numbers sn
      on sn.store_no = v.store_no
     and (v.paid_at at time zone 'Asia/Tokyo')::date >= sn.valid_from
     and (sn.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < sn.valid_to)
    join public.discount_types d on d.code = sn.discount_code
    where sn.partner_id = p_partner
      and ((select private.is_admin()) or p_partner = (select private.my_partner_id()) or coalesce((select auth.role()), '') = 'service_role')
      and not v.excluded
      and (v.paid_at at time zone 'Asia/Tokyo') >= date_trunc('month', p_month)
      and (v.paid_at at time zone 'Asia/Tokyo') < date_trunc('month', p_month) + interval '1 month'
  )
  select u.n, u.gross, coalesce(t.rate, 0),
         floor(u.gross * (1 - coalesce(t.rate, 0)))::int
  from usage u
  left join public.volume_tiers t on u.n >= t.min_count and (t.max_count is null or u.n <= t.max_count);
$$;
revoke all on function public.monthly_charge(uuid, date) from public, anon;
grant execute on function public.monthly_charge(uuid, date) to authenticated, service_role;

-- ---- imports: server key only
create or replace function public.import_validations(p_run_id bigint, p_rows jsonb)
returns table (added int, already_present int)
language plpgsql security definer set search_path = '' as $$
declare
  v_added int := 0;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'not allowed';
  end if;

  with incoming as (
    select (r->>'storeNo')::int as store_no,
           r->>'ticketType' as ticket_type,
           (r->>'paidAt')::timestamptz as paid_at,
           (r->>'enteredAt')::timestamptz as entered_at,
           (r->>'count')::int as quantity,
           (r->>'discountYen')::int as discount_yen
    from jsonb_array_elements(p_rows) r
  ),
  numbered as (
    select i.*, row_number() over (partition by store_no, entered_at, paid_at, discount_yen order by ticket_type) as occurrence
    from incoming i
  ),
  ins as (
    insert into public.validations (store_no, ticket_type, paid_at, entered_at, quantity, discount_yen, occurrence, import_run_id)
    select store_no, ticket_type, paid_at, entered_at, quantity, discount_yen, occurrence, p_run_id
    from numbered
    on conflict (store_no, entered_at, paid_at, discount_yen, occurrence) do nothing
    returning 1
  )
  select count(*) into v_added from ins;

  return query select v_added, jsonb_array_length(p_rows) - v_added;
end;
$$;
revoke all on function public.import_validations(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.import_validations(bigint, jsonb) to service_role;

revoke all on function public.next_invoice_no(text) from public, anon, authenticated;
grant execute on function public.next_invoice_no(text) to service_role;

-- ---- old public helpers are no longer used
drop function public.is_admin();
drop function public.my_partner_id();

-- ---- indexes for foreign keys
create index if not exists invoice_lines_invoice_id on public.invoice_lines (invoice_id);
create index if not exists invoice_lines_discount_code on public.invoice_lines (discount_code);
create index if not exists invoices_cancels on public.invoices (cancels_invoice_id);
create index if not exists payments_invoice_id on public.payments (invoice_id);
create index if not exists profiles_partner_id on public.profiles (partner_id);
create index if not exists store_numbers_discount_code on public.store_numbers (discount_code);
create index if not exists store_numbers_partner_id on public.store_numbers (partner_id);
create index if not exists validations_import_run on public.validations (import_run_id);
