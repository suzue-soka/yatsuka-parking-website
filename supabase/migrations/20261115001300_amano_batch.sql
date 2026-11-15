-- One setup request to Amano for all waiting machines (all partners); mark exactly those machines as ordered.
create or replace function public.mark_machines_amano_ordered(p_machine_ids bigint[], p_date date) returns int
language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.machines set amano_ordered_on = coalesce(p_date, (now() at time zone 'Asia/Tokyo')::date)
   where id = any (p_machine_ids) and machine_code is not null and shipped_on is null
     and cancelled_at is null and amano_ordered_on is null;
  get diagnostics v_n = row_count;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'mark_amano_ordered', 'machines', array_to_string(p_machine_ids, ','), jsonb_build_object('date', p_date, 'machines', v_n));
  return v_n;
end;
$$;
revoke all on function public.mark_machines_amano_ordered(bigint[], date) from public, anon;
grant execute on function public.mark_machines_amano_ordered(bigint[], date) to authenticated;
