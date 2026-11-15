'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

const back = (id, params) => redirect(`/admin/partners/${id}?${new URLSearchParams(params)}`);
const s = (fd, k, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

// Invite the partner's contact email to the portal and link the account to the partner.
async function invite(partner) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(partner.email, {
    redirectTo: `${await origin()}/auth/callback?next=password`,
  });
  if (error) throw new Error(error.message);
  const { error: pErr } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, role: 'partner', partner_id: partner.id, preferred_lang: partner.applied_lang || null }, { onConflict: 'id' });
  if (pErr) throw new Error(pErr.message);
}

export async function approveApplication(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const { error } = await supabase.rpc('approve_application', { p_partner: id });
  if (error) back(id, { err: error.message });
  const { data: partner } = await supabase.from('partners').select('id, name, email, applied_lang').eq('id', id).single();
  let inviteError = null;
  try {
    await invite(partner);
  } catch (e) {
    inviteError = e.message;
  }
  revalidatePath('/admin');
  revalidatePath('/admin/partners');
  // Back to the list, where the row now shows 承認済み.
  if (inviteError) back(id, { warn: inviteError });
  redirect(`/admin/partners?${new URLSearchParams({ ok: 'invited', name: partner?.name || '' })}`);
}

export async function resendInvite(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const { data: partner } = await supabase.from('partners').select('id, email, applied_lang').eq('id', id).single();
  try {
    await invite(partner);
  } catch (e) {
    back(id, { err: e.message });
  }
  back(id, { ok: 'invited' });
}

export async function rejectApplication(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const { error } = await supabase.rpc('reject_application', { p_partner: id, p_note: s(fd, 'note', 1000) || null });
  revalidatePath('/admin');
  revalidatePath('/admin/partners');
  if (error) back(id, { err: error.message });
  redirect(`/admin/partners?${new URLSearchParams({ ok: 'rejected' })}`);
}

export async function confirmPayment(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const { error } = await supabase.rpc('confirm_bank_payment', {
    p_invoice: s(fd, 'invoice', 40),
    p_paid_on: s(fd, 'paid_on', 10),
    p_amount: Number(s(fd, 'amount', 12)),
    p_note: s(fd, 'note', 500) || null,
  });
  revalidatePath('/admin');
  back(id, error ? { err: error.message } : { ok: 'saved' });
}

export async function recordShipment(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const { error } = await supabase.rpc('record_shipment', {
    p_partner: id,
    p_serial: s(fd, 'serial', 100),
    p_carrier: s(fd, 'carrier', 100),
    p_tracking: s(fd, 'tracking', 100),
    p_shipped_on: s(fd, 'shipped_on', 10),
  });
  revalidatePath('/admin');
  back(id, error ? { err: error.message } : { ok: 'saved' });
}

export async function startService(fd) {
  const { supabase } = await requireAdmin();
  const id = s(fd, 'id', 40);
  const stores = [0, 1]
    .map((i) => ({ store_no: Number(s(fd, `store_no_${i}`, 6)), discount_code: s(fd, `discount_${i}`, 10) }))
    .filter((x) => x.store_no > 0 && x.discount_code);
  const { error } = await supabase.rpc('start_service', { p_partner: id, p_from: s(fd, 'from', 10), p_stores: stores });
  revalidatePath('/admin');
  back(id, error ? { err: error.message } : { ok: 'saved' });
}

export async function closeInquiry(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('inquiries')
    .update({ status: 'closed', admin_note: s(fd, 'answer', 5000) || null, closed_at: new Date().toISOString() })
    .eq('id', Number(s(fd, 'inquiry', 20)));
  revalidatePath('/admin/requests');
  redirect(`/admin/requests?${new URLSearchParams(error ? { err: error.message } : { ok: 'saved' })}`);
}

export async function reviewChange(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('review_change_request', {
    p_id: Number(s(fd, 'request', 20)),
    p_approve: s(fd, 'decision', 10) === 'approve',
    p_note: s(fd, 'note', 1000) || null,
  });
  revalidatePath('/admin/requests');
  redirect(`/admin/requests?${new URLSearchParams(error ? { err: error.message } : { ok: 'saved' })}`);
}
