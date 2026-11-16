-- Lines may be removed together with their draft invoice (ON DELETE CASCADE): at that point the invoice
-- row is already gone, so a missing invoice is allowed; the invoice's own trigger already refused
-- deleting issued invoices. (Before this fix 「下書きを作り直す」 failed.)
create or replace function public.protect_invoice_lines() returns trigger
language plpgsql set search_path to '' as $function$
declare v_status text;
begin
  select status into v_status from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if v_status is not null and v_status <> 'draft' then raise exception 'lines of an issued invoice cannot be changed'; end if;
  return coalesce(new, old);
end;
$function$;
