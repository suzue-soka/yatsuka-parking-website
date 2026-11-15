-- Owner, 2026-11-16: invoice line wording 「駐車場利用料金（1時間）」 instead of 「駐車割引認証（1時間無料）」.
create or replace function public.create_monthly_drafts(p_month date, p_issued date, p_due date, p_import_run bigint)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month')::date;
  r record; l record;
  v_inv uuid; v_n int; v_gross int; v_rate numeric; v_total int; v_disc int; v_count int := 0;
begin
  if not private.admin_or_service() then raise exception 'admin only'; end if;
  perform pg_advisory_xact_lock(hashtext('monthly_drafts'));
  if exists (select 1 from public.billing_runs where month = v_month) then return 0; end if;

  for r in
    select distinct p.id, p.partner_code from public.partners p
      join public.store_numbers sn on sn.partner_id = p.id
     where sn.valid_from < v_end and (sn.valid_to is null or sn.valid_to > v_month)
       and not exists (select 1 from public.invoices i where i.partner_id = p.id and i.kind = 'monthly'
                        and i.period_month = v_month and i.status <> 'cancelled')
     order by p.partner_code
  loop
    select c.validation_count, c.gross_yen, c.volume_rate, c.total_yen into v_n, v_gross, v_rate, v_total
      from public.monthly_charge(r.id, v_month) c;
    if coalesce(v_n, 0) = 0 then continue; end if;   -- no validations: no invoice
    insert into public.invoices (invoice_no, partner_id, kind, period_month, status, validation_count, gross_yen,
                                 volume_rate, total_yen, tax_yen, issued_on, due_on)
    values ('DRAFT-' || replace(gen_random_uuid()::text, '-', ''), r.id, 'monthly', v_month, 'draft', v_n, v_gross,
            v_rate, v_total, floor(v_total * 10 / 110.0)::int, p_issued, p_due)
    returning id into v_inv;
    -- One line per discount value (price per validation fixed at billing time), then the volume discount.
    for l in
      select d.code, d.hours, d.unit_yen, sum(v.quantity)::int as qty
        from public.validations v
        join public.store_numbers sn on sn.store_no = v.store_no
         and (v.paid_at at time zone 'Asia/Tokyo')::date >= sn.valid_from
         and (sn.valid_to is null or (v.paid_at at time zone 'Asia/Tokyo')::date < sn.valid_to)
        join public.discount_types d on d.code = sn.discount_code
       where sn.partner_id = r.id and not v.excluded
         and (v.paid_at at time zone 'Asia/Tokyo') >= v_month
         and (v.paid_at at time zone 'Asia/Tokyo') < v_end
       group by d.code, d.hours, d.unit_yen
       order by d.hours
    loop
      insert into public.invoice_lines (invoice_id, description, discount_code, quantity, unit_yen, amount_yen)
      values (v_inv, '駐車場利用料金（' || l.hours || '時間）', l.code, l.qty, l.unit_yen, l.qty * l.unit_yen);
    end loop;
    v_disc := v_gross - v_total;
    if v_disc > 0 then
      insert into public.invoice_lines (invoice_id, description, quantity, unit_yen, amount_yen)
      values (v_inv, '数量割引（' || v_n || '件・' || round(v_rate * 100)::int || '%）', 1, -v_disc, -v_disc);
    end if;
    v_count := v_count + 1;
  end loop;

  insert into public.billing_runs (month, drafts, import_run_id) values (v_month, v_count, p_import_run);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'create_monthly_drafts', 'billing_run', v_month::text,
          jsonb_build_object('drafts', v_count, 'issued', p_issued, 'due', p_due, 'import_run', p_import_run));
  return v_count;
end;
$$;
