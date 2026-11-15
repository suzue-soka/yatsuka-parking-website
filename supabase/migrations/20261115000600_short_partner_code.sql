-- Partner IDs become P001, P002 … (was P-0001). Shorter to type in a bank-transfer name.
-- Three digits minimum; P1000 and above stay valid if ever needed.

alter table public.partners drop constraint partners_partner_code_check;

update public.partners
   set partner_code = 'P' || lpad(substring(partner_code from 3)::int::text, 3, '0')
 where partner_code ~ '^P-[0-9]{4}$';

alter table public.partners
  add constraint partners_partner_code_check check (partner_code ~ '^P[0-9]{3,}$');

insert into public.audit_log (actor, action, entity, entity_id, detail)
values (null, 'rename_partner_codes', 'partner', 'all', jsonb_build_object('from', 'P-0000', 'to', 'P000'));

create or replace function public.approve_application(p_partner uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  perform pg_advisory_xact_lock(hashtext('partner_code'));
  if not exists (select 1 from public.partners where id = p_partner and status = 'applied') then
    raise exception 'application not found or already reviewed';
  end if;
  select 'P' || lpad((coalesce(max(substring(partner_code from 2)::int), 0) + 1)::text, 3, '0')
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
