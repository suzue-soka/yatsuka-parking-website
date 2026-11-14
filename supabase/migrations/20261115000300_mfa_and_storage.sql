-- Two-step verification is required for all data access:
-- the helpers only recognise a user whose session is aal2 (password + authenticator code).
-- Private storage bucket for the original ParkingWeb CSV files.

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function private.my_partner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.partner_id from public.profiles p
  where p.id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

insert into storage.buckets (id, name, public)
values ('parkingweb', 'parkingweb', false)
on conflict (id) do nothing;
-- No storage policies: only the server key can read or write these files.
