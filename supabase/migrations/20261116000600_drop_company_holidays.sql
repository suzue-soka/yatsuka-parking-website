-- Owner, 2026-11-16: the due date ignores 鈴江's own holidays (only weekends and public holidays).
drop function if exists public.add_company_holiday(date, text);
drop function if exists public.remove_company_holiday(date);
drop table if exists public.company_holidays;
