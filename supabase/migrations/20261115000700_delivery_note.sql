-- 納品書 (delivery note) for each shipped validation machine: number DN-YYYY-NNNNNN,
-- issued with the shipment (issue date = shipping date). Content is built from the machine,
-- its machine invoice and the partner; the PDF is generated on request.
alter table public.machines add column if not exists delivery_note_no text unique;

create or replace function public.record_shipment(p_partner uuid, p_serial text, p_carrier text, p_tracking text, p_shipped_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare v_inv uuid; v_dn text;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if not exists (select 1 from public.partners where id = p_partner and status = 'preparing') then
    raise exception 'partner is not waiting for a machine';
  end if;
  select id into v_inv from public.invoices where partner_id = p_partner and kind = 'equipment' and status = 'paid'
   order by created_at desc limit 1;
  v_dn := public.next_invoice_no('DN-' || extract(year from coalesce(p_shipped_on, current_date))::int);
  insert into public.machines (partner_id, serial_no, equipment_invoice_id, shipped_on, carrier, tracking_no, delivery_note_no)
  values (p_partner, nullif(trim(p_serial), ''), v_inv, p_shipped_on, nullif(trim(p_carrier), ''), nullif(trim(p_tracking), ''), v_dn);
  update public.partners set status = 'shipped' where id = p_partner;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'record_shipment', 'partner', p_partner::text,
          jsonb_build_object('serial', p_serial, 'carrier', p_carrier, 'tracking', p_tracking, 'shipped_on', p_shipped_on, 'delivery_note', v_dn));
end;
$$;
