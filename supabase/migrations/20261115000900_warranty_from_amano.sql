-- Warranty starts when Amano delivers the machine to 鈴江 (owner, 2026-11-15), entered with the shipment.
alter table public.machines add column if not exists received_on date; -- delivered by Amano to 鈴江

drop function if exists public.record_shipment(uuid, text, text, text, date);
create or replace function public.record_shipment(p_partner uuid, p_serial text, p_carrier text, p_tracking text, p_shipped_on date,
                                                  p_received_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_inv uuid; v_dn text; v_stores jsonb; s jsonb;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select planned_stores into v_stores from public.partners where id = p_partner and status = 'preparing';
  if not found then raise exception 'partner is not waiting for a machine'; end if;
  if v_stores is null or jsonb_array_length(v_stores) not between 1 and 2 then
    raise exception 'register the store numbers (店No.) first';
  end if;
  if p_received_on is null then raise exception 'enter the date Amano delivered the machine'; end if;
  if p_received_on > p_shipped_on then raise exception 'the Amano delivery date cannot be after the shipping date'; end if;
  select id into v_inv from public.invoices where partner_id = p_partner and kind = 'equipment' and status = 'paid'
   order by created_at desc limit 1;
  v_dn := public.next_invoice_no('DN-' || extract(year from p_shipped_on)::int);
  insert into public.machines (partner_id, serial_no, equipment_invoice_id, shipped_on, carrier, tracking_no, delivery_note_no,
                               received_on, warranty_until)
  values (p_partner, nullif(trim(p_serial), ''), v_inv, p_shipped_on, nullif(trim(p_carrier), ''), nullif(trim(p_tracking), ''), v_dn,
          p_received_on, (p_received_on + interval '1 year' - interval '1 day')::date);
  for s in select * from jsonb_array_elements(v_stores) loop
    insert into public.store_numbers (store_no, partner_id, discount_code, valid_from)
    values ((s->>'store_no')::int, p_partner, s->>'discount_code', p_shipped_on);
  end loop;
  update public.partners set status = 'active', active_from = p_shipped_on where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'record_shipment', 'partner', p_partner::text,
          jsonb_build_object('serial', p_serial, 'carrier', p_carrier, 'tracking', p_tracking, 'shipped_on', p_shipped_on,
                             'received_on', p_received_on, 'delivery_note', v_dn, 'stores', v_stores, 'service_from', p_shipped_on));
end;
$$;
revoke all on function public.record_shipment(uuid, text, text, text, date, date) from public, anon;
grant execute on function public.record_shipment(uuid, text, text, text, date, date) to authenticated;
