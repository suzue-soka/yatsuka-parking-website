# Database (Supabase, Tokyo — project `yatsuka-parking`)

Migrations in `migrations/` are applied in order. Both are live on the Supabase project.

| Migration | What it does |
|---|---|
| `20261115000100_core.sql` | Tables: discount types, volume tiers, partners, profiles, 店No. mapping (with validity periods), import runs, validations, invoices + lines, payments, audit log. Count-based ParkingWeb import, gap-free invoice numbers, monthly charge, protection of issued invoices and validations, row-level security. |
| `20261115000200_hardening.sql` | Helper functions moved to a non-public schema; partner usage served by `my_validations()` (never shows 割引額); imports and invoice numbering only with the server key; separate admin write policies; foreign-key indexes. |

Rules enforced in the database:
- Partners see only their own partner record, 店No., usage counts and published invoices.
- 割引額 from ParkingWeb is admin-only; partners see counts at the full unit value.
- Re-importing the same report adds nothing; identical rows are kept and counted.
- Validations cannot be edited or deleted (an admin can only mark one as excluded, with a reason).
- Issued invoices cannot be edited or deleted; corrections are made with a cancellation invoice.
- Monthly charge = floor(Σ(count × unit value) × (1 − volume rate)), rate from the partner's monthly total.

Tested locally against the January 2026 ParkingWeb report: 3,207 validations / ¥3,114,000;
店No.3 → 459 validations, ¥137,700, 20% → ¥110,160.
