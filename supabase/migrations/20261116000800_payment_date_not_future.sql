-- Owner, 2026-11-16: a payment date cannot be in the future (Japan time); amount must be positive.
create or replace function public.confirm_bank_payment(p_invoice uuid, p_paid_on date, p_amount integer, p_note text)
 returns void language plpgsql security definer set search_path to ''
as $function$
declare v_inv public.invoices; v_paid int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  if p_paid_on is null or p_paid_on > (now() at time zone 'Asia/Tokyo')::date then
    raise exception 'the payment date cannot be in the future';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'the amount must be positive'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  if v_inv.id is null or v_inv.status not in ('published', 'paid') then raise exception 'invoice not payable'; end if;
  insert into public.payments (invoice_id, method, amount_yen, paid_on, confirmed_by, note)
  values (p_invoice, 'bank', p_amount, p_paid_on, auth.uid(), p_note);
  select coalesce(sum(amount_yen), 0) into v_paid from public.payments where invoice_id = p_invoice;
  if v_paid >= v_inv.total_yen and v_inv.status = 'published' then
    update public.invoices set status = 'paid' where id = p_invoice;
    if v_inv.kind = 'equipment' then
      perform private.assign_machine_ids(p_invoice);
      update public.partners set status = 'preparing' where id = v_inv.partner_id and status = 'awaiting_payment';
    end if;
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'confirm_bank_payment', 'invoice', p_invoice::text, jsonb_build_object('amount', p_amount, 'paid_on', p_paid_on));
end;
$function$;
