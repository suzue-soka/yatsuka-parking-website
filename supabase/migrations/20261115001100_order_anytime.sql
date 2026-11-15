-- Partners may order more machines at any time after approval, including while 認証機準備中
-- (owner, 2026-11-15). Still one unpaid machine order at a time.
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
  if v_status not in ('approved', 'preparing', 'shipped', 'active') then
    raise exception 'machines cannot be ordered now (status %)', v_status;
  end if;
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
