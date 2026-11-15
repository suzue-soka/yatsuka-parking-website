-- Machine requests (owner, 2026-11-16).
--  * The application lists the machines wanted (1–5, each with 1–2 discount values).
--  * Approving the application approves those machines; extra machines later need a new request
--    and the admin's approval.
--  * The partner orders an approved request (accepting that paid orders cannot be cancelled or
--    refunded) → invoice. Unpaid orders can be cancelled; paid orders are final.
create table if not exists public.machine_requests (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  kind text not null check (kind in ('application', 'additional')),
  items jsonb not null,                       -- [{"discounts": ["1h"]}, {"discounts": ["1h", "3h"]}]
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn', 'ordered', 'cancelled')),
  invoice_id uuid references public.invoices (id),
  decided_at timestamptz,
  decided_by uuid,
  note text,
  no_refund_agreed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists machine_requests_partner on public.machine_requests (partner_id);
alter table public.machine_requests enable row level security;
drop policy if exists machine_requests_select on public.machine_requests;
create policy machine_requests_select on public.machine_requests for select to authenticated
  using ((select private.is_admin()) or partner_id = (select private.my_partner_id()));
revoke all on public.machine_requests from anon;
revoke insert, update, delete on public.machine_requests from authenticated;

-- Validates [{"discounts": [...]}, …]: 1–5 machines, 1–2 different known discount values each.
create or replace function private.check_machine_items(p_items jsonb) returns int
language plpgsql stable security definer set search_path = '' as $$
declare it jsonb; v_codes text[]; v_n int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'invalid machine list'; end if;
  v_n := jsonb_array_length(p_items);
  if v_n not between 1 and 5 then raise exception 'choose 1 to 5 machines'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select array_agg(x) into v_codes from jsonb_array_elements_text(it->'discounts') x;
    if v_codes is null or cardinality(v_codes) not between 1 and 2 then raise exception 'each machine needs 1 or 2 discount values'; end if;
    if cardinality(v_codes) = 2 and v_codes[1] = v_codes[2] then raise exception 'the two discount values of a machine must differ'; end if;
    if exists (select 1 from unnest(v_codes) c where c not in (select code from public.discount_types)) then raise exception 'invalid discount type'; end if;
  end loop;
  return v_n;
end;
$$;

-- Approving / rejecting the application decides its machine request too.
create or replace function private.application_request_follows() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'applied' and new.status in ('approved', 'rejected') then
    update public.machine_requests
       set status = case when new.status = 'approved' then 'approved' else 'rejected' end,
           decided_at = now(), decided_by = auth.uid()
     where partner_id = new.id and kind = 'application' and status = 'pending';
  end if;
  return new;
end;
$$;
drop trigger if exists partners_application_request on public.partners;
create trigger partners_application_request after update of status on public.partners
  for each row execute function private.application_request_follows();

-- Partner: ask for extra machines (needs the admin's approval). One open request at a time.
create or replace function public.request_more_machines(p_items jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id(); v_status text; v_id bigint;
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  select status into v_status from public.partners where id = v_partner for update;
  if v_status not in ('approved', 'preparing', 'shipped', 'active') then
    raise exception 'machines cannot be requested now (status %)', v_status;
  end if;
  if exists (select 1 from public.machine_requests where partner_id = v_partner and status in ('pending', 'approved')) then
    raise exception 'there is already an open machine request';
  end if;
  if exists (select 1 from public.invoices where partner_id = v_partner and kind = 'equipment' and status in ('draft', 'approved', 'published')) then
    raise exception 'there is already an unpaid machine order';
  end if;
  perform private.check_machine_items(p_items);
  insert into public.machine_requests (partner_id, kind, items) values (v_partner, 'additional', p_items) returning id into v_id;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'request_machines', 'machine_request', v_id::text, jsonb_build_object('items', p_items));
  return v_id;
end;
$$;

-- Partner: withdraw a request that has not been ordered yet.
create or replace function public.withdraw_machine_request(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id();
begin
  update public.machine_requests set status = 'withdrawn'
   where id = p_id and partner_id = v_partner and status in ('pending', 'approved');
  if not found then raise exception 'request not found or already ordered'; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'withdraw_machine_request', 'machine_request', p_id::text, '{}'::jsonb);
end;
$$;

-- Admin: approve or reject a request for extra machines.
create or replace function public.decide_machine_request(p_id bigint, p_approve boolean, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.machine_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_at = now(), decided_by = auth.uid(), note = nullif(trim(p_note), '')
   where id = p_id and status = 'pending';
  if not found then raise exception 'request not found or already decided'; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'decide_machine_request', 'machine_request', p_id::text, jsonb_build_object('approve', p_approve, 'note', p_note));
end;
$$;

-- Partner: order the machines of an approved request → qualified invoice EQ-YYYY-NNNNNN.
create or replace function public.order_machine_request(p_id bigint, p_no_refund boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid := private.my_partner_id();
  v_status text;
  v_req public.machine_requests;
  v_price public.price_list;
  v_id uuid;
  v_n int;
  v_total int;
  it jsonb;
  v_codes text[];
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  if not coalesce(p_no_refund, false) then raise exception 'please accept that paid orders cannot be cancelled'; end if;
  select status into v_status from public.partners where id = v_partner for update;
  if v_status not in ('approved', 'preparing', 'shipped', 'active') then raise exception 'machines cannot be ordered now (status %)', v_status; end if;
  select * into v_req from public.machine_requests where id = p_id and partner_id = v_partner for update;
  if v_req.id is null or v_req.status <> 'approved' then raise exception 'this request is not approved or already ordered'; end if;
  if exists (select 1 from public.invoices where partner_id = v_partner and kind = 'equipment' and status in ('draft', 'approved', 'published')) then
    raise exception 'there is already an unpaid machine order';
  end if;
  v_n := private.check_machine_items(v_req.items);
  select * into v_price from public.price_list where code = 'qr_validator';
  v_total := v_price.unit_yen * v_n;
  insert into public.invoices (invoice_no, partner_id, kind, status, total_yen, tax_yen, issued_on, due_on)
  values (public.next_invoice_no('EQ-' || extract(year from v_today)::int), v_partner, 'equipment', 'draft',
          v_total, floor(v_total * 10 / 110.0)::int, v_today, v_today + 30)
  returning id into v_id;
  insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
  values (v_id, v_price.label, v_n, v_price.unit_yen, v_total);
  for it in select * from jsonb_array_elements(v_req.items) loop
    select array_agg(x) into v_codes from jsonb_array_elements_text(it->'discounts') x;
    insert into public.machines (partner_id, equipment_invoice_id, discount_codes) values (v_partner, v_id, v_codes);
  end loop;
  update public.invoices set status = 'published', published_at = now() where id = v_id;
  update public.machine_requests set status = 'ordered', invoice_id = v_id, no_refund_agreed_at = now() where id = p_id;
  if v_status = 'approved' then update public.partners set status = 'awaiting_payment' where id = v_partner; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'order_machines', 'invoice', v_id::text,
          jsonb_build_object('request', p_id, 'items', v_req.items, 'unit', v_price.unit_yen, 'no_refund_agreed', true));
  return v_id;
end;
$$;

-- Unpaid orders only: partner or admin. Paid orders are final (no cancellation, no refund).
create or replace function private.cancel_unpaid_order(p_invoice uuid, p_by text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices;
begin
  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null or v_inv.kind <> 'equipment' then raise exception 'order not found'; end if;
  if v_inv.status <> 'published' or exists (select 1 from public.payments where invoice_id = p_invoice) then
    raise exception 'only unpaid orders can be cancelled';
  end if;
  update public.invoices set status = 'cancelled' where id = p_invoice;
  update public.machines set cancelled_at = now() where equipment_invoice_id = p_invoice and cancelled_at is null;
  update public.machine_requests set status = 'cancelled' where invoice_id = p_invoice;
  perform private.settle_partner_status(v_inv.partner_id);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'cancel_machine_order', 'invoice', p_invoice::text, jsonb_build_object('by', p_by, 'invoice_no', v_inv.invoice_no));
end;
$$;

create or replace function public.cancel_my_machine_order(p_invoice uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id();
begin
  if v_partner is null then raise exception 'not a partner'; end if;
  if not exists (select 1 from public.invoices where id = p_invoice and partner_id = v_partner) then raise exception 'order not found'; end if;
  perform private.cancel_unpaid_order(p_invoice, 'partner');
end;
$$;

create or replace function public.cancel_unpaid_machine_order(p_invoice uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  perform private.cancel_unpaid_order(p_invoice, 'admin');
end;
$$;

-- Permissions: free ordering and paid-order cancellation (refund + CN-) are no longer offered.
revoke all on function private.check_machine_items(jsonb) from public, anon, authenticated;
revoke all on function private.cancel_unpaid_order(uuid, text) from public, anon, authenticated;
revoke all on function public.request_more_machines(jsonb) from public, anon;
revoke all on function public.withdraw_machine_request(bigint) from public, anon;
revoke all on function public.decide_machine_request(bigint, boolean, text) from public, anon;
revoke all on function public.order_machine_request(bigint, boolean) from public, anon;
revoke all on function public.cancel_my_machine_order(uuid) from public, anon;
revoke all on function public.cancel_unpaid_machine_order(uuid) from public, anon;
grant execute on function public.request_more_machines(jsonb) to authenticated;
grant execute on function public.withdraw_machine_request(bigint) to authenticated;
grant execute on function public.decide_machine_request(bigint, boolean, text) to authenticated;
grant execute on function public.order_machine_request(bigint, boolean) to authenticated;
grant execute on function public.cancel_my_machine_order(uuid) to authenticated;
grant execute on function public.cancel_unpaid_machine_order(uuid) to authenticated;
revoke execute on function public.order_validation_machines(jsonb) from authenticated;
revoke execute on function public.cancel_machine_order(uuid, date, int, text) from authenticated;
revoke all on function public.cancel_machine_order(uuid, date, int, text) from public, anon, authenticated;
revoke all on function public.order_validation_machines(jsonb) from public, anon, authenticated;
-- requested_discounts now holds every discount value of all requested machines (shown on the 約款 page).
alter table public.partners drop constraint if exists partners_requested_discounts;
alter table public.partners add constraint partners_requested_discounts
  check (requested_discounts is null or cardinality(requested_discounts) between 1 and 10);
