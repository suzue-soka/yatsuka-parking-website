-- 約款 第16条: after a repair or replacement by the maker (Amano), the partner reports it to 鈴江,
-- and 鈴江 asks Amano to confirm the 認証設定 (owner, 2026-11-17). Repairs themselves are between the
-- partner and Amano; this table only records the report and the confirmation.
create table if not exists public.machine_reports (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  machine_id bigint not null references public.machines (id),
  created_by uuid not null default auth.uid(),
  kind text not null check (kind in ('repair', 'replacement')),
  happened_on date not null,
  new_serial text check (new_serial is null or char_length(new_serial) between 1 and 60),
  note text check (note is null or char_length(note) <= 2000),
  status text not null default 'open' check (status in ('open', 'confirmed')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists machine_reports_partner_idx on public.machine_reports (partner_id);
create index if not exists machine_reports_machine_idx on public.machine_reports (machine_id);
alter table public.machine_reports enable row level security;
-- Read only; rows are written by the two functions below.
create policy machine_reports_select on public.machine_reports for select to authenticated
  using (partner_id = (select private.my_partner_id()) or (select private.is_admin()));

create or replace function public.report_machine_service(p_machine bigint, p_kind text, p_on date, p_new_serial text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_partner uuid := private.my_partner_id(); v_shipped date; v_id bigint;
begin
  if v_partner is null then raise exception 'partner only'; end if;
  if p_kind is null or p_kind not in ('repair', 'replacement') then raise exception 'choose repair or replacement'; end if;
  select shipped_on into v_shipped from public.machines
   where id = p_machine and partner_id = v_partner and shipped_on is not null and cancelled_at is null;
  if not found then raise exception 'machine not found'; end if;
  if p_on is null then raise exception 'enter the date'; end if;
  if p_on > (now() at time zone 'Asia/Tokyo')::date then raise exception 'the date cannot be in the future'; end if;
  if p_on < v_shipped then raise exception 'the date cannot be before the machine was shipped'; end if;
  insert into public.machine_reports (partner_id, machine_id, kind, happened_on, new_serial, note)
  values (v_partner, p_machine, p_kind, p_on,
          case when p_kind = 'replacement' then nullif(trim(p_new_serial), '') end, nullif(trim(p_note), ''))
  returning id into v_id;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'report_machine_service', 'machine', p_machine::text,
          jsonb_build_object('report', v_id, 'kind', p_kind, 'happened_on', p_on));
end;
$$;
revoke all on function public.report_machine_service(bigint, text, date, text, text) from public, anon;
grant execute on function public.report_machine_service(bigint, text, date, text, text) to authenticated;

-- 鈴江 records that the settings were confirmed with Amano.
create or replace function public.confirm_machine_report(p_id bigint, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'admin only'; end if;
  update public.machine_reports
     set status = 'confirmed', admin_note = nullif(trim(p_note), ''), confirmed_by = auth.uid(), confirmed_at = now()
   where id = p_id and status = 'open';
  if not found then raise exception 'report not found or already confirmed'; end if;
  insert into public.audit_log (actor, action, entity, entity_id, detail)
  values (auth.uid(), 'confirm_machine_report', 'machine_report', p_id::text, jsonb_build_object('note', p_note));
end;
$$;
revoke all on function public.confirm_machine_report(bigint, text) from public, anon;
grant execute on function public.confirm_machine_report(bigint, text) to authenticated;
