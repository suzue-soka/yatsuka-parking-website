-- First use per machine: earliest validation under one of the machine's 店No. on or after shipping.
create or replace function public.machine_first_use(p_partner uuid)
returns table (machine_id bigint, first_use date)
language sql stable security definer set search_path = '' as $$
  select m.id, min((v.paid_at at time zone 'Asia/Tokyo')::date)
    from public.machines m
    join public.validations v on v.store_no = any (m.store_nos)
   where m.partner_id = p_partner
     and m.shipped_on is not null
     and not v.excluded
     and (v.paid_at at time zone 'Asia/Tokyo')::date >= m.shipped_on
     and (private.is_admin() or p_partner = private.my_partner_id())
   group by m.id
$$;
revoke all on function public.machine_first_use(uuid) from public, anon;
grant execute on function public.machine_first_use(uuid) to authenticated;
