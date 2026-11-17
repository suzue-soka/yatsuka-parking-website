'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { machineItems } from '@/lib/machine-items';
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

// Ask for extra machines (1–5, each with 1–2 discount values); the admin approves before ordering.
export async function requestMachines(fd) {
  const { supabase } = await requirePartner('/portal/billing');
  const { error } = await supabase.rpc('request_more_machines', { p_items: machineItems(fd) });
  revalidatePath('/portal');
  go('/portal/billing', error ? { err: error.message } : { ok: 'requested' });
}

// Order the machines of an approved request (application or extra request) → invoice.
export async function orderRequest(fd) {
  const { supabase } = await requirePartner('/portal/billing');
  const { data, error } = await supabase.rpc('order_machine_request', {
    p_id: Number(fd.get('request')) || 0,
    p_no_refund: fd.get('no_refund') === 'on',
  });
  revalidatePath('/portal');
  if (error) go('/portal/billing', { err: error.message });
  redirect(`/portal/invoices/${data}`);
}

// Withdraw a request that has not been ordered yet.
export async function withdrawRequest(fd) {
  const { supabase } = await requirePartner('/portal/billing');
  const { error } = await supabase.rpc('withdraw_machine_request', { p_id: Number(fd.get('request')) || 0 });
  revalidatePath('/portal');
  go('/portal/billing', error ? { err: error.message } : { ok: 'withdrawn' });
}

// Cancel an unpaid machine order (the partner's own). Paid orders are final.
export async function cancelMyOrder(fd) {
  const { supabase, O } = await requirePartner('/portal/billing');
  const { error } = await supabase.rpc('cancel_my_machine_order', { p_invoice: s(fd, 'invoice', 40) });
  revalidatePath('/portal');
  // The page may have been opened before 鈴江 confirmed the payment: explain instead of showing the database message.
  const paid = error && /only unpaid/.test(error.message);
  go('/portal/billing', error ? { err: paid ? O.billing.alreadyPaid : error.message } : { ok: 'orderCancelled' });
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

// 約款 第16条: the partner reports a repair or replacement done by the maker.
export async function reportMachineService(fd) {
  const { supabase } = await requirePartner('/portal/guide');
  const { error } = await supabase.rpc('report_machine_service', {
    p_machine: Number(s(fd, 'machine', 20)),
    p_kind: s(fd, 'kind', 20),
    p_on: s(fd, 'on', 10) || null,
    p_new_serial: s(fd, 'new_serial', 60),
    p_note: s(fd, 'note', 2000),
  });
  revalidatePath('/portal/guide');
  go('/portal/guide', error ? { err: error.message } : { ok: 'reported' });
}
