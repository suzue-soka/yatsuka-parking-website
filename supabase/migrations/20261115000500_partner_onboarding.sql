-- Partner onboarding: applications, review, machine purchase, shipment, start of service,
-- plus partner inquiries and company-information change requests.

-- ---------------------------------------------------------------- applications
-- An application is a partners row in status 'applied'. The 提携店舗ID is issued at approval.
alter table public.partners alter column partner_code drop not null;
alter table public.partners
  add constraint partners_code_when_approved check (status in ('applied', 'rejected') or partner_code is not null);

alter table public.partners
  add column if not exists expected_usage text,
  add column if not exists requested_discounts text[],
  add column if not exists doc_kind text check (doc_kind in ('registry', 'kaigyo')),
  add column if not exists doc_path text,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists antisocial_declared_at timestamptz,
  add column if not exists applied_lang text check (applied_lang in ('ja', 'en', 'zh')),
  add column if not exists reviewed_by uuid,
  add column if not exists review_note text,
  add column if not exists rejected_at timestamptz;
alter table public.partners
  add constraint partners_requested_discounts check (requested_discounts is null or cardinality(requested_discounts) between 1 and 2);
create index if not exists partners_status_idx on public.partners (status);

-- Uploaded 登記事項証明書 / 開業届 (private; written by the server only, read by admins).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applications', 'applications', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
create policy applications_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'applications' and (select private.is_admin()));

-- ---------------------------------------------------------------- prices (fixed into each order)
create table public.price_list (
  code text primary key,
  label text not null,
  unit_yen int not null check (unit_yen > 0), -- tax included
  updated_at timestamptz not null default now()
);
insert into public.price_list (code, label, unit_yen) values ('qr_validator', '省スペース型QRコード割引券発行機', 40000);
alter table public.price_list enable row level security;
create policy price_list_select on public.price_list for select to authenticated using (true);
create policy price_list_admin_update on public.price_list for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------- machines
create table public.machines (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  model text not null default '省スペース型QRコード割引券発行機',
  serial_no text,
  equipment_invoice_id uuid references public.invoices (id),
  shipped_on date,
  carrier text,
  tracking_no text,
  delivered_on date,
  warranty_until date,
  location text,
  created_at timestamptz not null default now()
);
create index machines_partner_idx on public.machines (partner_id);
create index machines_invoice_idx on public.machines (equipment_invoice_id);
alter table public.machines enable row level security;
create policy machines_select on public.machines for select to authenticated
  using (partner_id = (select private.my_partner_id()) or (select private.is_admin()));
create policy machines_admin_insert on public.machines for insert to authenticated with check ((select private.is_admin()));
create policy machines_admin_update on public.machines for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------- inquiries
create table public.inquiries (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  created_by uuid not null default auth.uid(),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'open' check (status in ('open', 'closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index inquiries_partner_idx on public.inquiries (partner_id);
alter table public.inquiries enable row level security;
create policy inquiries_select on public.inquiries for select to authenticated
  using (partner_id = (select private.my_partner_id()) or (select private.is_admin()));
create policy inquiries_insert on public.inquiries for insert to authenticated
  with check (partner_id = (select private.my_partner_id()) and created_by = (select auth.uid()) and status = 'open' and admin_note is null);
create policy inquiries_admin_update on public.inquiries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------- change requests (billing-relevant fields)
create table public.change_requests (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  created_by uuid not null default auth.uid(),
  changes jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(changes) = 'object')
);
create index change_requests_partner_idx on public.change_requests (partner_id);
alter table public.change_requests enable row level security;
create policy change_requests_select on public.change_requests for select to authenticated
  using (partner_id = (select private.my_partner_id()) or (select private.is_admin()));
create policy change_requests_insert on public.change_requests for insert to authenticated
  with check (partner_id = (select private.my_partner_id()) and created_by = (select auth.uid()) and status = 'pending'
              and changes ?| array['name', 'name_kana', 'representative', 'address', 'billing_name', 'billing_address']
              and not (changes - array['name', 'name_kana', 'representative', 'address', 'billing_name', 'billing_address'] <> '{}'::jsonb));

-- ---------------------------------------------------------------- partner self-service
-- Contact details and listing permissions: changed directly by the partner.
create or replace function public.update_my_contact(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id();
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  update public.partners set
    contact_name = coalesce(nullif(trim(p->>'contact_name'), ''), contact_name),
    phone        = coalesce(nullif(trim(p->>'phone'), ''), phone),
    email        = coalesce(nullif(trim(p->>'email'), ''), email),
    website      = case when p ? 'website' then nullif(trim(p->>'website'), '') else website end,
    hours        = case when p ? 'hours' then nullif(trim(p->>'hours'), '') else hours end,
    holidays     = case when p ? 'holidays' then nullif(trim(p->>'holidays'), '') else holidays end,
    permission_a = coalesce((p->>'permission_a')::boolean, permission_a),
    permission_b = coalesce((p->>'permission_b')::boolean, permission_b)
  where id = v_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'update_contact', 'partner', v_partner::text, p);
end;
$$;

-- Order the validation machine: issues the equipment invoice at today's price.
create or replace function public.order_validation_machine() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid := private.my_partner_id();
  v_status text;
  v_price public.price_list;
  v_id uuid;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  select status into v_status from public.partners where id = v_partner for update;
  if v_status <> 'approved' then raise exception 'machine can be ordered only after approval (status %)', v_status; end if;
  if exists (select 1 from public.invoices where partner_id = v_partner and kind = 'equipment' and status <> 'cancelled') then
    raise exception 'machine already ordered';
  end if;
  select * into v_price from public.price_list where code = 'qr_validator';
  insert into public.invoices (invoice_no, partner_id, kind, status, total_yen, tax_yen, issued_on, due_on)
  values (public.next_invoice_no('EQ-' || extract(year from v_today)::int), v_partner, 'equipment', 'draft',
          v_price.unit_yen, floor(v_price.unit_yen * 10 / 110.0)::int, v_today, v_today + 30)
  returning id into v_id;
  insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
  values (v_id, v_price.label, 1, v_price.unit_yen, v_price.unit_yen);
  update public.invoices set status = 'published', published_at = now() where id = v_id;
  update public.partners set status = 'awaiting_payment' where id = v_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'order_machine', 'invoice', v_id::text, jsonb_build_object('price', v_price.unit_yen));
  return v_id;
end;
$$;

-- ---------------------------------------------------------------- administrator actions
create or replace function public.approve_application(p_partner uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  perform pg_advisory_xact_lock(hashtext('partner_code'));
  if not exists (select 1 from public.partners where id = p_partner and status = 'applied') then
    raise exception 'application not found or already reviewed';
  end if;
  select 'P-' || lpad((coalesce(max(substring(partner_code from 3)::int), 0) + 1)::text, 4, '0')
    into v_code from public.partners where partner_code is not null;
  update public.partners
     set partner_code = v_code, status = 'approved', approved_at = now(), reviewed_by = auth.uid(),
         billing_name = coalesce(billing_name, name), billing_address = coalesce(billing_address, address)
   where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'approve_application', 'partner', p_partner::text, jsonb_build_object('partner_code', v_code));
  return v_code;
end;
$$;

create or replace function public.reject_application(p_partner uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.partners set status = 'rejected', rejected_at = now(), reviewed_by = auth.uid(), review_note = p_note
   where id = p_partner and status = 'applied';
  if not found then raise exception 'application not found or already reviewed'; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'reject_application', 'partner', p_partner::text, jsonb_build_object('note', p_note));
end;
$$;

-- Bank transfer received: records the payment, marks the invoice paid when covered,
-- and moves a machine order on to 認証機準備中.
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
      update public.partners set status = 'preparing' where id = v_inv.partner_id and status = 'awaiting_payment';
    end if;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'confirm_bank_payment', 'invoice', p_invoice::text, jsonb_build_object('amount', p_amount, 'paid_on', p_paid_on));
end;
$$;

create or replace function public.record_shipment(p_partner uuid, p_serial text, p_carrier text, p_tracking text, p_shipped_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_inv uuid;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if not exists (select 1 from public.partners where id = p_partner and status = 'preparing') then
    raise exception 'partner is not waiting for a machine';
  end if;
  select id into v_inv from public.invoices where partner_id = p_partner and kind = 'equipment' and status = 'paid'
   order by created_at desc limit 1;
  insert into public.machines (partner_id, serial_no, equipment_invoice_id, shipped_on, carrier, tracking_no)
  values (p_partner, nullif(trim(p_serial), ''), v_inv, p_shipped_on, nullif(trim(p_carrier), ''), nullif(trim(p_tracking), ''));
  update public.partners set status = 'shipped' where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'record_shipment', 'partner', p_partner::text,
          jsonb_build_object('serial', p_serial, 'carrier', p_carrier, 'tracking', p_tracking, 'shipped_on', p_shipped_on));
end;
$$;

-- Machine delivered and installed: register its 店No. and start billing from p_from.
create or replace function public.start_service(p_partner uuid, p_from date, p_stores jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare s jsonb;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if not exists (select 1 from public.partners where id = p_partner and status = 'shipped') then
    raise exception 'machine has not been shipped yet';
  end if;
  if jsonb_typeof(p_stores) <> 'array' or jsonb_array_length(p_stores) not between 1 and 2 then
    raise exception 'one or two store numbers are required';
  end if;
  for s in select * from jsonb_array_elements(p_stores) loop
    insert into public.store_numbers (store_no, partner_id, discount_code, valid_from)
    values ((s->>'store_no')::int, p_partner, s->>'discount_code', p_from);
  end loop;
  update public.machines set delivered_on = coalesce(delivered_on, p_from),
         warranty_until = coalesce(warranty_until, p_from + interval '1 year' - interval '1 day')
   where partner_id = p_partner and delivered_on is null;
  update public.partners set status = 'active', active_from = p_from where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'start_service', 'partner', p_partner::text, jsonb_build_object('from', p_from, 'stores', p_stores));
end;
$$;

create or replace function public.review_change_request(p_id bigint, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.change_requests;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into r from public.change_requests where id = p_id and status = 'pending' for update;
  if r.id is null then raise exception 'request not found or already reviewed'; end if;
  if p_approve then
    update public.partners set
      name            = coalesce(nullif(trim(r.changes->>'name'), ''), name),
      name_kana       = coalesce(nullif(trim(r.changes->>'name_kana'), ''), name_kana),
      representative  = coalesce(nullif(trim(r.changes->>'representative'), ''), representative),
      address         = coalesce(nullif(trim(r.changes->>'address'), ''), address),
      billing_name    = coalesce(nullif(trim(r.changes->>'billing_name'), ''), billing_name),
      billing_address = coalesce(nullif(trim(r.changes->>'billing_address'), ''), billing_address)
    where id = r.partner_id;
  end if;
  update public.change_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
   where id = p_id;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), case when p_approve then 'approve_change' else 'reject_change' end, 'change_request', p_id::text, r.changes);
end;
$$;

revoke all on function public.update_my_contact(jsonb), public.order_validation_machine(),
  public.approve_application(uuid), public.reject_application(uuid, text),
  public.confirm_bank_payment(uuid, date, int, text), public.record_shipment(uuid, text, text, text, date),
  public.start_service(uuid, date, jsonb), public.review_change_request(bigint, boolean, text)
  from public, anon;
grant execute on function public.update_my_contact(jsonb), public.order_validation_machine(),
  public.approve_application(uuid), public.reject_application(uuid, text),
  public.confirm_bank_payment(uuid, date, int, text), public.record_shipment(uuid, text, text, text, date),
  public.start_service(uuid, date, jsonb), public.review_change_request(bigint, boolean, text)
  to authenticated;
