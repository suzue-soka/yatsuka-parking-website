// Server-only client with the secret key. Never import this from a client component.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
