-- Validation values are amounts of money (owner, 2026-11-17): the machine takes a fixed amount off the
-- parking fee; 「1時間無料」 is only the daytime equivalent. Values without an hour equivalent (1,400円,
-- 18,900円 in the new system) are allowed: hours becomes optional, and admin-only values are not offered
-- to partners (listed = false). Invoice lines name the amount: 「駐車場利用料金（300円）」.
alter table public.discount_types alter column hours drop not null;
alter table public.discount_types add column if not exists listed boolean not null default true;
insert into public.discount_types (code, label, hours, unit_yen, sort, listed)
values ('y1400', '1,400円', null, 1400, 45, false)
on conflict (code) do nothing;

-- Partners can only request listed values.
create or replace function private.check_machine_items(p_items jsonb)
 returns integer language plpgsql stable security definer set search_path to '' as $function$
declare it jsonb; v_codes text[]; v_n int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'invalid machine list'; end if;
  v_n := jsonb_array_length(p_items);
  if v_n not between 1 and 5 then raise exception 'choose 1 to 5 machines'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    select array_agg(x) into v_codes from jsonb_array_elements_text(it->'discounts') x;
    if v_codes is null or cardinality(v_codes) not between 1 and 2 then raise exception 'each machine needs 1 or 2 discount values'; end if;
    if cardinality(v_codes) = 2 and v_codes[1] = v_codes[2] then raise exception 'the two discount values of a machine must differ'; end if;
    if exists (select 1 from unnest(v_codes) c where c not in (select code from public.discount_types where listed)) then raise exception 'invalid discount type'; end if;
  end loop;
  return v_n;
end;
$function$;

-- Invoice line wording by amount, lines ordered by amount.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.create_monthly_drafts(date, date, date, bigint)'::regprocedure);
  d := replace(d, $q$'駐車場利用料金（' || l.hours || '時間）'$q$, $q$'駐車場利用料金（' || to_char(l.unit_yen, 'FM999,999,999') || '円）'$q$);
  d := replace(d, 'order by d.hours', 'order by d.unit_yen');
  if position('to_char(l.unit_yen' in d) = 0 or position('order by d.unit_yen' in d) = 0 then
    raise exception 'create_monthly_drafts did not match';
  end if;
  execute d;
end $$;
