'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMail } from '@/lib/mail';
import { shippedMail } from '@/lib/content/mail';
import { carrierFor } from '@/lib/carriers';

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
  const serials = {};
  for (const [k, v] of fd.entries()) {
    const m = /^serial_(\d+)$/.exec(k);
    if (m) serials[m[1]] = String(v).trim().slice(0, 100);
  }
  const { error } = await supabase.rpc('record_shipment', {
    p_partner: id,
    p_serials: serials,
    p_carrier: s(fd, 'carrier', 100),
    p_tracking: s(fd, 'tracking', 100),
    p_shipped_on: s(fd, 'shipped_on', 10),
    p_received_on: s(fd, 'received_on', 10) || null,
  });
  revalidatePath('/admin');
  if (error) back(id, { err: error.message });

  // Tell the partner by email, in their language. The shipment stays recorded even if the email fails.
  let mailError = null;
  try {
    const [{ data: p }, { data: last }, { data: prof }] = await Promise.all([
      supabase.from('partners').select('name, partner_code, email, applied_lang').eq('id', id).single(),
      supabase.from('machines').select('id, delivery_note_no').eq('partner_id', id).not('shipped_on', 'is', null).order('id', { ascending: false }).limit(1).single(),
      supabase.from('profiles').select('preferred_lang').eq('partner_id', id).limit(1).maybeSingle(),
    ]);
    const { data: shipped } = await supabase.from('machines').select('*').eq('delivery_note_no', last.delivery_note_no).order('machine_no');
    if (!p?.email) throw new Error('no email address');
    const lang = prof?.preferred_lang || p.applied_lang || 'ja';
    const m = shipped[0];
    const carrier = carrierFor(m?.carrier);
    const mail = shippedMail(lang, {
      name: p.name,
      code: p.partner_code,
      machines: shipped.map((x) => ({ code: x.machine_code, model: x.model, serial: x.serial_no })),
      shippedOn: m?.shipped_on,
      carrierName: carrier ? carrier[lang] || carrier.ja : m?.carrier,
      carrierUrl: carrier?.url || null,
      tracking: m?.tracking_no,
      portalUrl: `${await origin()}/portal/billing`,
      deliveryNoteUrl: `${await origin()}/portal/machines/${m.id}/delivery-note?download=1`,
    });
    await sendMail({ to: p.email, ...mail });
  } catch (e) {
    mailError = e.message;
  }
  if (mailError) back(id, { warn: mailError, wk: 'shippedNoMail' });
  back(id, { ok: 'shippedMailed' });
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
