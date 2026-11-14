'use server';

import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { DISCOUNT_TYPES, CATEGORIES, USAGE, DOC_KINDS, MAX_DOC_BYTES } from '@/lib/program-data';

const LANGS = ['ja', 'en', 'zh'];
const CODES = DISCOUNT_TYPES.map((d) => d.code);

// File type from its first bytes, not from the name or the browser's claim.
function sniff(bytes) {
  if (bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return { ext: 'pdf', type: 'application/pdf' };
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', type: 'image/png' };
  return null;
}

const text = (fd, k, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max);

// Public partner application (no login). Returns { ok } or { error: key }.
export async function submitApplication(lang, prevState, fd) {
  const appLang = LANGS.includes(lang) ? lang : 'ja';

  // Bots: hidden field must stay empty and the form must have been open a few seconds.
  if (text(fd, 'company_url')) return { ok: true };
  const started = Number(fd.get('started') || 0);
  if (!started || Date.now() - started < 3000) return { error: 'tooMany' };

  const v = {
    name: text(fd, 'company'),
    category: text(fd, 'category', 20),
    representative: text(fd, 'representative'),
    contact_name: text(fd, 'contact'),
    address: text(fd, 'address', 300),
    phone: text(fd, 'phone', 30),
    email: text(fd, 'email', 200).toLowerCase(),
    website: text(fd, 'website', 300) || null,
    expected_usage: text(fd, 'usage', 20),
    doc_kind: text(fd, 'doc_kind', 20),
  };
  if (!v.name || !v.representative || !v.contact_name || !v.address || !v.phone || !v.email) return { error: 'required' };
  if (!CATEGORIES.includes(v.category) || !USAGE.includes(v.expected_usage) || !DOC_KINDS.includes(v.doc_kind)) return { error: 'required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { error: 'email' };
  if (v.website && !/^https?:\/\//i.test(v.website)) v.website = `https://${v.website}`;

  const discounts = [...new Set(fd.getAll('discounts').map(String))].filter((c) => CODES.includes(c));
  if (discounts.length < 1 || discounts.length > 2) return { error: 'discounts' };

  if (fd.get('terms') !== 'on' || fd.get('privacy') !== 'on' || fd.get('antisocial') !== 'on') return { error: 'consent' };

  const file = fd.get('document');
  if (!file || typeof file === 'string' || file.size === 0 || file.size > MAX_DOC_BYTES) return { error: 'file' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return { error: 'file' };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'server' };
  }

  // Simple limits: 3 applications per email per day, 30 per hour in total.
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const [{ count: byEmail }, { count: total }] = await Promise.all([
    admin.from('partners').select('id', { count: 'exact', head: true }).eq('email', v.email).gte('created_at', dayAgo),
    admin.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'applied').gte('created_at', hourAgo),
  ]);
  if ((byEmail ?? 0) >= 3 || (total ?? 0) >= 30) return { error: 'tooMany' };

  const now = new Date();
  const path = `${now.toISOString().slice(0, 7)}/${randomUUID()}.${kind.ext}`;
  const { error: upErr } = await admin.storage.from('applications').upload(path, bytes, { contentType: kind.type, upsert: false });
  if (upErr) return { error: 'server' };

  const at = now.toISOString();
  const { error: insErr } = await admin.from('partners').insert({
    ...v,
    status: 'applied',
    requested_discounts: discounts,
    doc_path: path,
    terms_agreed_at: at,
    privacy_agreed_at: at,
    antisocial_declared_at: at,
    permission_a: fd.get('permission_a') === 'on',
    permission_b: fd.get('permission_b') === 'on',
    applied_lang: appLang,
  });
  if (insErr) {
    await admin.storage.from('applications').remove([path]);
    return { error: 'server' };
  }
  return { ok: true };
}
