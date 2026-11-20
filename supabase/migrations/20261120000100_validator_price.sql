-- Validation machine price: 46,200円 tax included (42,000円 + tax), owner 2026-11-20.
-- Existing orders and issued invoices keep the price fixed at order time.
update public.price_list set unit_yen = 46200, updated_at = now() where code = 'qr_validator';
