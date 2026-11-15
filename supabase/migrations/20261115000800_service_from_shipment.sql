-- Simplified start of service (owner, 2026-11-15):
--  * The admin registers the 店No. for each discount value while preparing the machine
--    (the same numbers Amano programs into it): partners.planned_stores.
--  * Recording the shipment starts the service: store numbers count from the shipping date,
--    status goes straight to 'active'. Nothing used before that date is billed.
--  * Delivery date = shipping date + 2 days (owner's choice); warranty 1 year from delivery.
--  * First use is read from the imported ParkingWeb data (first_use_date).
alter table public.partners add column if not exists planned_stores jsonb;

create or replace function public.set_planned_stores(p_partner uuid, p_stores jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare s jsonb; v_no int; v_code text; v_seen int[] := '{}';
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if not exists (select 1 from public.partners where id = p_partner and status in ('approved', 'awaiting_payment', 'preparing')) then
    raise exception 'store numbers can only be set before the machine is shipped';
  end if;
  if jsonb_typeof(p_stores) <> 'array' or jsonb_array_length(p_stores) not between 1 and 2 then
    raise exception 'one or two store numbers are required';
  end if;
  for s in select * from jsonb_array_elements(p_stores) loop
    v_no := (s->>'store_no')::int;
    v_code := s->>'discount_code';
    if v_no is null or v_no <= 0 then raise exception 'invalid store number'; end if;
    if v_no = any (v_seen) then raise exception 'store number % is entered twice', v_no; end if;
    v_seen := v_seen || v_no;
    if not exists (select 1 from public.discount_types where code = v_code) then raise exception 'invalid discount type'; end if;
    if exists (select 1 from public.store_numbers where store_no = v_no and (valid_to is null or valid_to > current_date)) then
      raise exception 'store number % is already in use', v_no;
    end if;
    if exists (select 1 from public.partners p, jsonb_array_elements(coalesce(p.planned_stores, '[]')) x
               where p.id <> p_partner and p.status in ('approved', 'awaiting_payment', 'preparing') and (x->>'store_no')::int = v_no) then
      raise exception 'store number % is already planned for another partner', v_no;
    end if;
  end loop;
  update public.partners set planned_stores = p_stores where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'set_planned_stores', 'partner', p_partner::text, jsonb_build_object('stores', p_stores));
end;
$$;

create or replace function public.record_shipment(p_partner uuid, p_serial text, p_carrier text, p_tracking text, p_shipped_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_inv uuid; v_dn text; v_stores jsonb; s jsonb; v_delivered date;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select planned_stores into v_stores from public.partners where id = p_partner and status = 'preparing';
  if not found then raise exception 'partner is not waiting for a machine'; end if;
  if v_stores is null or jsonb_array_length(v_stores) not between 1 and 2 then
    raise exception 'register the store numbers (店No.) first';
  end if;
  select id into v_inv from public.invoices where partner_id = p_partner and kind = 'equipment' and status = 'paid'
   order by created_at desc limit 1;
  v_dn := public.next_invoice_no('DN-' || extract(year from p_shipped_on)::int);
  v_delivered := p_shipped_on + 2;
  insert into public.machines (partner_id, serial_no, equipment_invoice_id, shipped_on, carrier, tracking_no, delivery_note_no,
                               delivered_on, warranty_until)
  values (p_partner, nullif(trim(p_serial), ''), v_inv, p_shipped_on, nullif(trim(p_carrier), ''), nullif(trim(p_tracking), ''), v_dn,
          v_delivered, (v_delivered + interval '1 year' - interval '1 day')::date);
  for s in select * from jsonb_array_elements(v_stores) loop
    insert into public.store_numbers (store_no, partner_id, discount_code, valid_from)
    values ((s->>'store_no')::int, p_partner, s->>'discount_code', p_shipped_on);
  end loop;
  update public.partners set status = 'active', active_from = p_shipped_on where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'record_shipment', 'partner', p_partner::text,
          jsonb_build_object('serial', p_serial, 'carrier', p_carrier, 'tracking', p_tracking, 'shipped_on', p_shipped_on,
                             'delivery_note', v_dn, 'stores', v_stores, 'service_from', p_shipped_on));
end;
$$;

-- First day the partner's machine was used (from imported ParkingWeb data); null if not yet.
create or replace function public.first_use_date(p_partner uuid) returns date
language sql stable security definer set search_path = '' as $$
  select min((v.paid_at at time zone 'Asia/Tokyo')::date)
    from public.validations v
    join public.store_numbers s on s.store_no = v.store_no
   where s.partner_id = p_partner
     and not v.excluded
     and (v.paid_at at time zone 'Asia/Tokyo')::date >= s.valid_from
     and (s.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < s.valid_to)
     and (private.is_admin() or p_partner = private.my_partner_id());
$$;
revoke all on function public.set_planned_stores(uuid, jsonb) from public, anon;
grant execute on function public.set_planned_stores(uuid, jsonb) to authenticated;
revoke all on function public.first_use_date(uuid) from public, anon;
grant execute on function public.first_use_date(uuid) to authenticated;
