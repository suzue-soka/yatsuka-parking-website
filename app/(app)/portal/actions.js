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

export async function orderMachine() {
  const { supabase } = await requirePartner('/portal/billing');
  const { data, error } = await supabase.rpc('order_validation_machine');
  revalidatePath('/portal');
  if (error) go('/portal/billing', { err: error.message });
  redirect(`/portal/invoices/${data}`);
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
