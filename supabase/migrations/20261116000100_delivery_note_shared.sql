-- One 納品書 (DN-) can list several machines shipped together, so the number is shared.
alter table public.machines drop constraint if exists machines_delivery_note_no_key;
create index if not exists machines_delivery_note_no_idx on public.machines (delivery_note_no);
