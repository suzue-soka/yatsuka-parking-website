'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requirePartner } from '@/lib/portal-guard';

const s = (fd, k, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);
const go = (path, params) => redirect(`${path}?${new URLSearchParams(params)}`);

export async function saveContact(fd) {
  const { supabase } = await requirePartner('/portal/company');
  const { error } = await supabase.rpc('update_my_contact', {
    p: {
      contact_name: s(fd, 'contact_name', 200),
      phone: s(fd, 'phone', 30),
      email: s(fd, 'email', 200),
      website: s(fd, 'website', 300),
      hours: s(fd, 'hours', 200),
      holidays: s(fd, 'holidays', 200),
      permission_a: fd.get('permission_a') === 'on',
      permission_b: fd.get('permission_b') === 'on',
    },
  });
  revalidatePath('/portal/company');
  go('/portal/company', error ? { err: error.message } : { ok: 'saved' });
}

const BILLING_FIELDS = ['name', 'name_kana', 'representative', 'address', 'billing_name', 'billing_address'];

export async function requestChange(fd) {
  const { supabase, partner } = await requirePartner('/portal/company');
  const changes = Object.fromEntries(BILLING_FIELDS.map((k) => [k, s(fd, k, 300)]).filter(([k, v]) => v && v !== partner?.[k]));
  if (!Object.keys(changes).length) go('/portal/company', { err: '—' });
  const { error } = await supabase.from('change_requests').insert({ partner_id: partner.id, changes });
  revalidatePath('/portal/company');
  go('/portal/company', error ? { err: error.message } : { ok: 'sent' });
}

// Order 1–5 machines, each with its own 1–2 discount values (fields d_<machine>_<0|1>).
export async function orderMachine(fd) {
  const { supabase } = await requirePartner('/portal/billing');
  const count = Math.min(5, Math.max(1, Number(fd.get('count')) || 1));
  const items = Array.from({ length: count }, (_, i) => ({
    discounts: [String(fd.get(`d_${i}_0`) || ''), String(fd.get(`d_${i}_1`) || '')].filter(Boolean),
  }));
  const { data, error } = await supabase.rpc('order_validation_machines', { p_items: items });
  revalidatePath('/portal');
  if (error) go('/portal/billing', { err: error.message });
  redirect(`/portal/invoices/${data}`);
}

// Cancel an unpaid machine order (the partner's own).
export async function cancelMyOrder(fd) {
  const { supabase, O } = await requirePartner('/portal/billing');
  const { error } = await supabase.rpc('cancel_my_machine_order', { p_invoice: s(fd, 'invoice', 40) });
  revalidatePath('/portal');
  // The page may have been opened before 鈴江 confirmed the payment: explain instead of showing the database message.
  const paid = error && /only unpaid|payment has already/.test(error.message);
  go('/portal/billing', error ? { err: paid ? O.billing.alreadyPaid : error.message } : { ok: 'orderCancelled' });
}

// Paid order not yet sent to Amano: ask 鈴江 to cancel it (sent as an inquiry; the refund is made by bank transfer).
export async function requestCancel(fd) {
  const { supabase, partner, O } = await requirePartner('/portal/billing');
  const invoiceNo = s(fd, 'invoice_no', 40);
  const { error } = await supabase.from('inquiries').insert({
    partner_id: partner.id,
    subject: O.billing.cancelRequestSubject(invoiceNo),
    body: O.billing.cancelRequestBody(invoiceNo),
  });
  revalidatePath('/portal/inquiries');
  go('/portal/billing', error ? { err: error.message } : { ok: 'cancelRequested' });
}

export async function sendInquiry(fd) {
  const { supabase, partner } = await requirePartner('/portal/inquiries');
  const subject = s(fd, 'subject', 200);
  const body = s(fd, 'body', 5000);
  if (!subject || !body) go('/portal/inquiries', { err: '—' });
  const { error } = await supabase.from('inquiries').insert({ partner_id: partner.id, subject, body });
  revalidatePath('/portal/inquiries');
  go('/portal/inquiries', error ? { err: error.message } : { ok: 'sent' });
}
