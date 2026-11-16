-- Overdue reminders (owner, 2026-11-16): the partner gets a reminder 1 day after the due date and again
-- 7 days after; partly paid invoices too (remaining amount). One row per invoice and stage, so a
-- reminder is never sent twice. Written by the daily cron (service role); admins can read.
create table public.invoice_reminders (
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  stage smallint not null check (stage in (1, 2)),
  sent_at timestamptz not null default now(),
  note text,                 -- e.g. 'no email address'
  primary key (invoice_id, stage)
);
alter table public.invoice_reminders enable row level security;
create policy invoice_reminders_admin on public.invoice_reminders for select to authenticated using ((select private.is_admin()));
revoke all on public.invoice_reminders from anon;
