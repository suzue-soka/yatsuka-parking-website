-- 提携店舗管理システム — core schema
-- Partners only ever see their own data, and never ParkingWeb's 割引額.
-- Financial records are append-only: issued invoices are corrected by cancellation + re-issue.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------- reference data
create table public.discount_types (
  code text primary key,                 -- '1h','2h','3h','4h','24h'
  label text not null,                   -- 1時間無料
  hours int not null,
  unit_yen int not null check (unit_yen > 0),  -- tax included
  sort int not null
);

insert into public.discount_types (code, label, hours, unit_yen, sort) values
  ('1h', '1時間無料', 1, 300, 1),
  ('2h', '2時間無料', 2, 600, 2),
  ('3h', '3時間無料', 3, 900, 3),
  ('4h', '4時間無料', 4, 1200, 4),
  ('24h', '24時間無料', 24, 2700, 5);

create table public.volume_tiers (
  min_count int primary key,
  max_count int,                          -- null = no upper limit
  rate numeric(4,3) not null check (rate >= 0 and rate < 1)
);

insert into public.volume_tiers (min_count, max_count, rate) values
  (1, 50, 0.05), (51, 100, 0.07), (101, 200, 0.10), (201, null, 0.20);

-- ---------------------------------------------------------------- partners & users
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  partner_code text unique not null check (partner_code ~ '^P-[0-9]{4}$'),
  name text not null,
  name_kana text,
  category text,
  representative text,
  contact_name text,
  email text,
  phone text,
  address text,
  billing_name text,
  billing_address text,
  status text not null default 'applied'
    check (status in ('applied','approved','awaiting_payment','preparing','shipped','active','suspended','terminated','rejected')),
  permission_a boolean not null default false,   -- ホームページへの掲載
  permission_b boolean not null default false,   -- 駐車場内掲示物への掲載
  hours text,
  holidays text,
  website text,
  logo_path text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  active_from date
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'partner' check (role in ('partner','admin')),
  partner_id uuid references public.partners (id),
  display_name text,
  created_at timestamptz not null default now(),
  check (role = 'admin' or partner_id is not null)
);

-- 店No. → partner + discount type, with validity periods (a 店No. can be re-assigned later)
create table public.store_numbers (
  id bigint generated always as identity primary key,
  store_no int not null check (store_no > 0),
  partner_id uuid not null references public.partners (id),
  discount_code text not null references public.discount_types (code),
  valid_from date not null,
  valid_to date,                          -- exclusive; null = open
  note text,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (store_no with =, daterange(valid_from, valid_to, '[)') with &&)
);

-- ---------------------------------------------------------------- helper functions
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_partner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select partner_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------- ParkingWeb imports
create table public.import_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  period_from timestamptz,
  period_to timestamptz,
  file_sha256 text,
  file_path text,                         -- original CSV in private storage
  status text not null default 'running' check (status in ('running','ok','failed','blocked')),
  rows_in_file int,
  rows_added int,
  rows_already_present int,
  file_total_count int,
  file_total_yen int,
  message text
);

create table public.validations (
  id bigint generated always as identity primary key,
  store_no int not null,
  ticket_type text not null,
  paid_at timestamptz not null,
  entered_at timestamptz not null,
  quantity int not null check (quantity > 0),
  discount_yen int not null,              -- ParkingWeb 割引額: admin only, never shown to partners
  occurrence int not null default 1,      -- k-th identical row (no transaction ID in ParkingWeb)
  import_run_id bigint not null references public.import_runs (id),
  created_at timestamptz not null default now(),
  excluded boolean not null default false,  -- set only by an admin after confirming a double export
  excluded_reason text,
  excluded_by uuid,
  unique (store_no, entered_at, paid_at, discount_yen, occurrence)
);
create index validations_store_paid on public.validations (store_no, paid_at);

-- Count-based import: for each group of identical rows, add only the increase.
-- Never deletes rows. Returns (added, already_present).
create or replace function public.import_validations(p_run_id bigint, p_rows jsonb)
returns table (added int, already_present int)
language plpgsql security definer set search_path = '' as $$
declare
  v_added int := 0;
  v_total int;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
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

  v_total := jsonb_array_length(p_rows);
  return query select v_added, v_total - v_added;
end;
$$;

-- What a partner may see: count only, at the full unit value, never 割引額.
create or replace view public.partner_validations
with (security_barrier = true) as
  select v.id, v.store_no, d.label as discount_label, d.unit_yen,
         v.paid_at, v.entered_at, v.quantity, sn.partner_id
  from public.validations v
  join public.store_numbers sn
    on sn.store_no = v.store_no
   and (v.paid_at at time zone 'Asia/Tokyo')::date >= sn.valid_from
   and (sn.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < sn.valid_to)
  join public.discount_types d on d.code = sn.discount_code
  where not v.excluded
    and (sn.partner_id = public.my_partner_id() or public.is_admin());

-- ---------------------------------------------------------------- invoices & payments
create table public.invoice_counters (
  prefix text primary key,               -- e.g. 'INV-2026', 'EQ-2026'
  last_no int not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  partner_id uuid not null references public.partners (id),
  kind text not null check (kind in ('monthly','equipment','change_fee','repair','cancellation')),
  period_month date,                      -- first day of the billed month (monthly invoices)
  status text not null default 'draft' check (status in ('draft','approved','published','paid','cancelled')),
  validation_count int,
  gross_yen int,                          -- Σ count × unit value
  volume_rate numeric(4,3),
  total_yen int not null,                 -- tax included
  tax_yen int not null,                   -- 10% portion of total_yen (内税)
  issued_on date,
  due_on date,
  cancels_invoice_id uuid references public.invoices (id),
  approved_by uuid,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind <> 'monthly' or period_month is not null)
);
create unique index invoices_one_monthly
  on public.invoices (partner_id, period_month)
  where kind = 'monthly' and status <> 'cancelled';

create table public.invoice_lines (
  id bigint generated always as identity primary key,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  discount_code text references public.discount_types (code),
  quantity int not null,
  unit_yen int not null,                  -- price fixed at the time of order / billing
  amount_yen int not null
);

create table public.payments (
  id bigint generated always as identity primary key,
  invoice_id uuid not null references public.invoices (id),
  method text not null check (method in ('bank','card')),
  amount_yen int not null check (amount_yen > 0),
  paid_on date not null,
  provider_event_id text unique,          -- Stripe event id (idempotency); null for bank transfers
  confirmed_by uuid,
  note text,
  created_at timestamptz not null default now()
);

-- Next number in a gap-free sequence (row lock serialises concurrent callers).
create or replace function public.next_invoice_no(p_prefix text) returns text
language plpgsql security definer set search_path = '' as $$
declare v int;
begin
  insert into public.invoice_counters (prefix) values (p_prefix) on conflict do nothing;
  update public.invoice_counters set last_no = last_no + 1 where prefix = p_prefix returning last_no into v;
  return p_prefix || '-' || lpad(v::text, 6, '0');
end;
$$;

-- Monthly calculation: invoice = floor(Σ(count × unit) × (1 − rate)); rate from the partner's total count.
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
      and (public.is_admin() or p_partner = public.my_partner_id() or coalesce(auth.role(), '') = 'service_role')
      and not v.excluded
      and (v.paid_at at time zone 'Asia/Tokyo') >= date_trunc('month', p_month)
      and (v.paid_at at time zone 'Asia/Tokyo') < date_trunc('month', p_month) + interval '1 month'
  )
  select u.n, u.gross, coalesce(t.rate, 0),
         floor(u.gross * (1 - coalesce(t.rate, 0)))::int
  from usage u
  left join public.volume_tiers t on u.n >= t.min_count and (t.max_count is null or u.n <= t.max_count);
$$;

-- Issued invoices cannot be changed, only moved forward in status.
create or replace function public.protect_issued_invoice() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'issued invoices cannot be deleted; issue a cancellation instead'; end if;
    return old;
  end if;
  if old.status <> 'draft' and (
       new.invoice_no, new.partner_id, new.kind, new.period_month, new.total_yen, new.tax_yen,
       new.validation_count, new.gross_yen, new.volume_rate, new.issued_on, new.due_on
     ) is distinct from (
       old.invoice_no, old.partner_id, old.kind, old.period_month, old.total_yen, old.tax_yen,
       old.validation_count, old.gross_yen, old.volume_rate, old.issued_on, old.due_on
     ) then
    raise exception 'issued invoice % cannot be changed', old.invoice_no;
  end if;
  return new;
end;
$$;
create trigger invoices_protect before update or delete on public.invoices
  for each row execute function public.protect_issued_invoice();

create or replace function public.protect_invoice_lines() returns trigger
language plpgsql set search_path = '' as $$
declare v_status text;
begin
  select status into v_status from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if v_status is distinct from 'draft' then raise exception 'lines of an issued invoice cannot be changed'; end if;
  return coalesce(new, old);
end;
$$;
create trigger invoice_lines_protect before insert or update or delete on public.invoice_lines
  for each row execute function public.protect_invoice_lines();

-- Validations are append-only except for the admin exclusion flag.
create or replace function public.protect_validations() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'validations cannot be deleted'; end if;
  if (new.store_no, new.ticket_type, new.paid_at, new.entered_at, new.quantity, new.discount_yen, new.occurrence, new.import_run_id)
     is distinct from
     (old.store_no, old.ticket_type, old.paid_at, old.entered_at, old.quantity, old.discount_yen, old.occurrence, old.import_run_id) then
    raise exception 'validations are read-only (only the exclusion flag may change)';
  end if;
  return new;
end;
$$;
create trigger validations_protect before update or delete on public.validations
  for each row execute function public.protect_validations();

-- ---------------------------------------------------------------- audit log
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb
);

-- ---------------------------------------------------------------- row-level security
alter table public.discount_types enable row level security;
alter table public.volume_tiers enable row level security;
alter table public.partners enable row level security;
alter table public.profiles enable row level security;
alter table public.store_numbers enable row level security;
alter table public.import_runs enable row level security;
alter table public.validations enable row level security;
alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.payments enable row level security;
alter table public.audit_log enable row level security;

-- Reference data: readable by signed-in users
create policy discount_types_read on public.discount_types for select to authenticated using (true);
create policy volume_tiers_read on public.volume_tiers for select to authenticated using (true);

-- Partners: own record; admins everything
create policy partners_read on public.partners for select to authenticated
  using (id = public.my_partner_id() or public.is_admin());
create policy partners_admin_write on public.partners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy store_numbers_read on public.store_numbers for select to authenticated
  using (partner_id = public.my_partner_id() or public.is_admin());
create policy store_numbers_admin_write on public.store_numbers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Raw imports and validations (with 割引額): admins only. Partners use partner_validations.
create policy import_runs_admin on public.import_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy validations_admin on public.validations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Invoices: partners see their own once published
create policy invoices_read on public.invoices for select to authenticated
  using (public.is_admin() or (partner_id = public.my_partner_id() and status in ('published','paid','cancelled')));
create policy invoices_admin_write on public.invoices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy invoice_lines_read on public.invoice_lines for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id
                 and (public.is_admin() or (i.partner_id = public.my_partner_id() and i.status in ('published','paid','cancelled')))));
create policy invoice_lines_admin_write on public.invoice_lines for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy payments_read on public.payments for select to authenticated
  using (public.is_admin() or exists (select 1 from public.invoices i where i.id = invoice_id and i.partner_id = public.my_partner_id()));
create policy payments_admin_write on public.payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy audit_admin on public.audit_log for select to authenticated using (public.is_admin());
-- invoice_counters: no policies → only security-definer functions / service role.

-- Anonymous visitors get nothing from these tables.
revoke all on all tables in schema public from anon;
revoke execute on function public.import_validations(bigint, jsonb) from public, anon;
revoke execute on function public.next_invoice_no(text) from public, anon, authenticated;
revoke execute on function public.monthly_charge(uuid, date) from public, anon;
grant select on public.partner_validations to authenticated;
revoke all on public.partner_validations from anon;
