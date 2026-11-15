// Server-only client with the secret key. Never import this from a client component.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

// Tolerate copy-paste slips in the Vercel value: spaces, line breaks, quotes, "NAME=" prefix.
export function secretKey() {
  let key = (process.env.SUPABASE_SECRET_KEY || '').trim();
  key = key.replace(/^SUPABASE_SECRET_KEY\s*=\s*/, '').replace(/^['"]|['"]$/g, '').trim();
  return key;
}

// Non-secret description of the configured key, for error codes only.
export function secretKeyShape() {
  const k = secretKey();
  if (!k) return 'none';
  if (k.startsWith('sb_publishable_')) return 'publishable';
  if (k.startsWith('sb_secret_')) return 'secret';
  if (k.startsWith('eyJ')) return 'jwt';
  return 'other';
}

export function createAdminClient() {
  const key = secretKey();
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
