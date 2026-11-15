-- Admin: reset a partner's two-step verification (e.g. new phone). Removes the registered
-- authenticator apps of the partner's accounts and ends their sign-ins; at the next sign-in
-- the partner registers the app again. Recorded in the audit log.
create or replace function public.reset_partner_mfa(p_partner uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare v_users uuid[]; v_factors int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  select array_agg(id) into v_users from public.profiles where partner_id = p_partner and role = 'partner';
  if v_users is null then raise exception 'this partner has no account'; end if;
  delete from auth.mfa_factors where user_id = any (v_users);
  get diagnostics v_factors = row_count;
  delete from auth.sessions where user_id = any (v_users);
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'reset_partner_mfa', 'partner', p_partner::text, jsonb_build_object('accounts', cardinality(v_users), 'factors', v_factors));
  return v_factors;
end;
$$;
revoke all on function public.reset_partner_mfa(uuid) from public, anon;
grant execute on function public.reset_partner_mfa(uuid) to authenticated;
