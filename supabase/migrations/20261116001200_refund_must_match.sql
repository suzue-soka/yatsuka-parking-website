-- Refund must account for the whole overpayment: refunded amount + bank fee deducted = overpayment (owner, 2026-11-16).
create or replace function public.settle_excess(p_invoice uuid, p_mode text, p_refunded_on date, p_amount int, p_fee int, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices; v_excess int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select * into v_inv from public.invoices where id = p_invoice for update;
  v_excess := private.invoice_paid(p_invoice) - v_inv.total_yen;
  if v_inv.id is null or v_inv.status <> 'paid' or v_inv.settlement is not null or v_excess <= 0 then
    raise exception 'there is no open overpayment on this invoice';
  end if;
  if p_mode = 'refund' then
    if p_refunded_on is null or p_refunded_on > (now() at time zone 'Asia/Tokyo')::date then raise exception 'the refund date cannot be in the future'; end if;
    if p_amount is null or p_amount <= 0 or coalesce(p_fee, 0) < 0 then raise exception 'the refunded amount must be positive'; end if;
    -- Owner, 2026-11-16: the refund closes the whole overpayment, so refund + bank fee deducted must equal it
    -- (a test entry of 440 with fee 0 for a 2,000 overpayment had closed it and lost 1,560).
    if p_amount + coalesce(p_fee, 0) <> v_excess then
      raise exception 'refund plus bank fee must equal the overpayment (%)', v_excess;
    end if;
    insert into public.refunds (invoice_id, amount_yen, refunded_on, method, confirmed_by, note)
    values (p_invoice, p_amount, p_refunded_on, 'bank', auth.uid(),
            concat_ws(' / ', case when coalesce(p_fee, 0) > 0 then '振込手数料 ' || p_fee || '円' end, nullif(trim(p_note), '')));
    update public.invoices set settlement = 'refunded', settled_yen = v_excess, settled_at = now(),
           settled_note = nullif(trim(p_note), '') where id = p_invoice;
  elsif p_mode = 'offset' then
    insert into public.billing_adjustments (partner_id, source_invoice_id, kind, amount_yen, created_by)
    values (v_inv.partner_id, p_invoice, 'excess', v_excess, auth.uid());
    update public.invoices set settlement = 'offset', settled_yen = v_excess, settled_at = now(),
           settled_note = nullif(trim(p_note), '') where id = p_invoice;
  else
    raise exception 'unknown mode';
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'settle_excess', 'invoice', p_invoice::text,
          jsonb_build_object('mode', p_mode, 'excess', v_excess, 'refunded', p_amount, 'fee', p_fee, 'on', p_refunded_on, 'note', p_note));
end;
$$;
