-- 0円 validations ARE billed (owner, 2026-11-17, reversing 20261117000300): a ParkingWeb row exists only when the
-- customer used the validation, and partners pay the full value regardless of the fee. A 0円 row is a stay
-- inside the free minutes.
drop trigger if exists validations_zero on public.validations;
drop function if exists private.exclude_zero_validation();
