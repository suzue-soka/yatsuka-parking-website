'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-guard';
import { jstToday } from '@/lib/dates';
import { dueDate } from '@/lib/holidays';
import { companyHolidays, publishAndNotify } from '@/lib/billing';

const s = (fd, k, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);
const back = (params) => redirect(`/admin/billing?${new URLSearchParams(params)}`);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

async function origin() {
  const h = await headers();
  return `${h.get('x-forwarded-proto') || 'https'}://${h.get('x-forwarded-host') || h.get('host')}`;
}

export async function saveAutoPublish(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('set_auto_publish', { p_on: fd.get('auto') === 'on' });
  revalidatePath('/admin/billing');
  back(error ? { err: error.message } : { ok: 'autoSaved' });
}

// Create a month's drafts by hand (normally done automatically at import).
export async function createDraftsNow(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  if (!isDate(month)) back({ err: 'month' });
  const today = jstToday();
  const { data, error } = await supabase.rpc('create_monthly_drafts', {
    p_month: month,
    p_issued: today,
    p_due: dueDate(today, await companyHolidays(supabase)),
    p_import_run: null,
  });
  revalidatePath('/admin');
  back(error ? { err: error.message } : { ok: data ? 'created' : 'createdNone', n: String(data || 0) });
}

// Publish the ticked drafts of a month: issue date = today, due date = 25th or the closest working day.
export async function publishDrafts(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  const ids = fd.getAll('ids').map(String).filter((v) => /^[0-9a-f-]{36}$/.test(v));
  if (!isDate(month) || !ids.length) back({ err: 'none selected' });
  const today = jstToday();
  const due = dueDate(today, await companyHolidays(supabase));
  const res = await publishAndNotify(supabase, { month, issued: today, due, ids, origin: await origin() });
  revalidatePath('/admin');
  revalidatePath('/portal');
  if (res.error) back({ err: res.error });
  if (res.mailErrors.length) back({ warn: res.mailErrors.join('、'), n: String(res.published), wk: 'mail' });
  back({ ok: 'published', n: String(res.published) });
}

// Delete a month's drafts and create them again from the latest data.
export async function redoDrafts(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  if (!isDate(month)) back({ err: 'month' });
  const { error: delErr } = await supabase.rpc('discard_monthly_drafts', { p_month: month });
  if (delErr) back({ err: delErr.message });
  const today = jstToday();
  const { data, error } = await supabase.rpc('create_monthly_drafts', {
    p_month: month,
    p_issued: today,
    p_due: dueDate(today, await companyHolidays(supabase)),
    p_import_run: null,
  });
  revalidatePath('/admin');
  back(error ? { err: error.message } : { ok: 'redone', n: String(data || 0) });
}

export async function addHoliday(fd) {
  const { supabase } = await requireAdmin();
  const day = s(fd, 'day', 10);
  if (!isDate(day)) back({ err: 'date' });
  const { error } = await supabase.rpc('add_company_holiday', { p_day: day, p_note: s(fd, 'note', 100) || null });
  revalidatePath('/admin/billing');
  back(error ? { err: error.message } : { ok: 'saved' });
}

export async function removeHoliday(fd) {
  const { supabase } = await requireAdmin();
  const day = s(fd, 'day', 10);
  if (!isDate(day)) back({ err: 'date' });
  const { error } = await supabase.rpc('remove_company_holiday', { p_day: day });
  revalidatePath('/admin/billing');
  back(error ? { err: error.message } : { ok: 'saved' });
}
