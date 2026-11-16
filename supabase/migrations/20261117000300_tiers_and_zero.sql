-- New volume discount tiers (owner, 2026-11-17): 1–600 = 10%, 601–800 = 20%, 801+ = 30%.
delete from public.volume_tiers;
insert into public.volume_tiers (min_count, max_count, rate) values (1, 600, 0.10), (601, 800, 0.20), (801, null, 0.30);

-- 0円 validations are never billed (owner, 2026-11-17): they are marked excluded when imported,
-- so every count, estimate and invoice leaves them out. The row stays for the record.
create or replace function private.exclude_zero_validation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.discount_yen = 0 and not new.excluded then
    new.excluded := true;
    new.excluded_reason := '割引額0円（請求対象外）';
  end if;
  return new;
end;
$$;
drop trigger if exists validations_zero on public.validations;
create trigger validations_zero before insert on public.validations
  for each row execute function private.exclude_zero_validation();
