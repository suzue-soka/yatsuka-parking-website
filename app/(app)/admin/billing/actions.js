'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-guard';
import { jstToday } from '@/lib/dates';
import { dueDate, balanceDueDate } from '@/lib/holidays';
import { sendMail } from '@/lib/mail';
import { monthlyInvoiceMail } from '@/lib/content/mail';
import { publishAndNotify } from '@/lib/billing';

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

// Create a month's drafts by hand (normally done automatically at import). Follows the
// 「自動で公開する」 setting like the import does: when it is on, the drafts are published at once.
export async function createDraftsNow(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  if (!isDate(month)) back({ err: 'month' });
  await draftAndMaybePublish(supabase, month, 'created');
}

async function draftAndMaybePublish(supabase, month, okKey, { neverPublish = false } = {}) {
  const today = jstToday();
  const due = dueDate(today);
  const { data: count, error } = await supabase.rpc('create_monthly_drafts', { p_month: month, p_issued: today, p_due: due, p_import_run: null });
  revalidatePath('/admin');
  if (error) back({ err: error.message });
  if (!count) back({ ok: 'createdNone' });
  const { data: settings } = await supabase.from('billing_settings').select('auto_publish').eq('id', 1).single();
  if (neverPublish || !settings?.auto_publish) back({ ok: okKey, n: String(count) });
  const res = await publishAndNotify(supabase, { month, issued: today, due, ids: null, origin: await origin() });
  revalidatePath('/portal');
  if (res.error) back({ err: res.error });
  if (res.mailErrors.length) back({ warn: res.mailErrors.join('、'), n: String(res.published), wk: 'mail' });
  back({ ok: 'published', n: String(res.published) });
}

// Publish the ticked drafts of a month: issue date = today, due date = 25th or the closest working day.
export async function publishDrafts(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  const ids = fd.getAll('ids').map(String).filter((v) => /^[0-9a-f-]{36}$/.test(v));
  if (!isDate(month) || !ids.length) back({ err: 'none selected' });
  const today = jstToday();
  const due = dueDate(today);
  const res = await publishAndNotify(supabase, { month, issued: today, due, ids, origin: await origin() });
  revalidatePath('/admin');
  revalidatePath('/portal');
  if (res.error) back({ err: res.error });
  if (res.mailErrors.length) back({ warn: res.mailErrors.join('、'), n: String(res.published), wk: 'mail' });
  back({ ok: 'published', n: String(res.published) });
}

// Delete a month's drafts and create them again from the latest data. Always stays as drafts, even
// with 「自動で公開する」 on: recreating means something was wrong, so the admin checks before publishing.
export async function redoDrafts(fd) {
  const { supabase } = await requireAdmin();
  const month = s(fd, 'month', 10);
  if (!isDate(month)) back({ err: 'month' });
  const { error: delErr } = await supabase.rpc('discard_monthly_drafts', { p_month: month });
  if (delErr) back({ err: delErr.message });
  await draftAndMaybePublish(supabase, month, 'redone', { neverPublish: true });
}

// Confirm a bank transfer directly from the issued-invoices list (unpaid status → small form).
export async function confirmPaymentInline(fd) {
  const { supabase } = await requireAdmin();
  const invoice = s(fd, 'invoice', 40);
  const keep = s(fd, 'unpaid', 1) === '1' ? { unpaid: '1' } : {};
  const { data: inv } = await supabase.from('invoices').select('invoice_no').eq('id', invoice).maybeSingle();
  const { error } = await supabase.rpc('confirm_bank_payment', {
    p_invoice: invoice,
    p_paid_on: s(fd, 'paid_on', 10),
    p_amount: Number(s(fd, 'amount', 12)),
    p_note: null,
  });
  revalidatePath('/admin');
  revalidatePath('/portal');
  // Back to the invoice list itself (#issued), not the top of the page.
  const qs = new URLSearchParams(error ? { ...keep, perr: error.message } : { ...keep, paid: inv?.invoice_no || '' });
  redirect(`/admin/billing?${qs}#issued`);
}

const backList = (fd, params) => {
  const keep = s(fd, 'unpaid', 1) === '1' ? { unpaid: '1' } : {};
  redirect(`/admin/billing?${new URLSearchParams({ ...keep, ...params })}#issued`);
};

// Partly paid invoice: bill the shortfall separately, add it to next month's invoice, or write it off.
export async function settleShortfallAction(fd) {
  const { supabase } = await requireAdmin();
  const invoice = s(fd, 'invoice', 40);
  const mode = s(fd, 'mode', 20);
  const { data: inv } = await supabase.from('invoices').select('invoice_no').eq('id', invoice).maybeSingle();
  const { error } = await supabase.rpc('settle_shortfall', { p_invoice: invoice, p_mode: mode, p_note: s(fd, 'note', 300) || null });
  revalidatePath('/admin');
  revalidatePath('/portal');
  backList(fd, error ? { perr: error.message } : { settled: inv?.invoice_no || '' });
}

// Overpaid invoice: record the refund made outside the site, or deduct it from next month's invoice.
export async function settleExcessAction(fd) {
  const { supabase } = await requireAdmin();
  const invoice = s(fd, 'invoice', 40);
  const mode = s(fd, 'mode', 20);
  const { data: inv } = await supabase.from('invoices').select('invoice_no').eq('id', invoice).maybeSingle();
  const { error } = await supabase.rpc('settle_excess', {
    p_invoice: invoice,
    p_mode: mode,
    p_refunded_on: mode === 'refund' ? s(fd, 'refunded_on', 10) || null : null,
    p_amount: mode === 'refund' ? Number(s(fd, 'amount', 12)) || null : null,
    p_fee: mode === 'refund' ? Number(s(fd, 'fee', 12)) || 0 : null,
    p_note: s(fd, 'note', 300) || null,
  });
  revalidatePath('/admin');
  revalidatePath('/portal');
  backList(fd, error ? { perr: error.message } : { settled: inv?.invoice_no || '' });
}

// Publish a shortfall invoice (number, issue date today, due date ≥ 7 days) and email the partner.
export async function publishBalanceAction(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const today = jstToday();
  const due = balanceDueDate(today);
  const { error } = await supabase.rpc('publish_balance_invoice', { p_id: id, p_issued: today, p_due: due });
  if (error) back({ err: error.message });
  revalidatePath('/admin');
  revalidatePath('/portal');
  let mailError = null;
  try {
    const { data: i } = await supabase
      .from('invoices')
      .select('invoice_no, total_yen, due_on, partner_id, balance_of, partners(name, email, applied_lang)')
      .eq('id', id)
      .single();
    const { data: orig } = await supabase.from('invoices').select('invoice_no').eq('id', i.balance_of).maybeSingle();
    const { data: prof } = await supabase.from('profiles').select('preferred_lang').eq('partner_id', i.partner_id).limit(1).maybeSingle();
    if (!i.partners?.email) throw new Error('no email address');
    const lang = prof?.preferred_lang || i.partners.applied_lang || 'ja';
    await sendMail({
      to: i.partners.email,
      ...monthlyInvoiceMail(lang, {
        name: i.partners.name,
        month: null,
        balanceOf: orig?.invoice_no,
        invoiceNo: i.invoice_no,
        total: i.total_yen,
        due: i.due_on,
        url: `${await origin()}/portal/invoices/${id}`,
      }),
    });
  } catch (e) {
    mailError = e.message;
  }
  if (mailError) back({ warn: mailError, n: '1', wk: 'mail' });
  back({ ok: 'published', n: '1' });
}

// Discard a shortfall draft: the original invoice goes back to 一部入金.
export async function discardBalanceAction(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('discard_balance_invoice', { p_id: s(fd, 'id', 40) });
  revalidatePath('/admin');
  back(error ? { err: error.message } : { ok: 'balanceDiscarded' });
}
