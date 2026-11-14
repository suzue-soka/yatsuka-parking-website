-- Remember each user's display language (ja / en / zh) across devices and logins.
alter table public.profiles
  add column if not exists preferred_lang text check (preferred_lang in ('ja', 'en', 'zh'));

-- Users may change only their own language, nothing else in their profile.
create or replace function public.set_my_lang(p_lang text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set preferred_lang = p_lang
  where id = (select auth.uid()) and p_lang in ('ja', 'en', 'zh');
$$;

revoke all on function public.set_my_lang(text) from public, anon;
grant execute on function public.set_my_lang(text) to authenticated;
