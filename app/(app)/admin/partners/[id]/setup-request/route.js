import { requireAdmin } from '@/lib/admin-guard';
import { setupRequestPdf } from '@/lib/setup-request-pdf';
import { pdfAssets, pdfResponse } from '@/lib/pdf/assets';
import { jstToday } from '@/lib/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin only: setup request to Amano for the partner's paid machines not shipped yet.
export async function GET(request, { params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [{ data: p }, { data: ms }] = await Promise.all([
    supabase.from('partners').select('partner_code, name, address').eq('id', id).maybeSingle(),
    supabase.from('machines').select('machine_code, discount_codes, store_nos').eq('partner_id', id).not('machine_code', 'is', null).is('shipped_on', null).order('machine_no'),
  ]);
  if (!p || !ms?.length) return new Response('Not found', { status: 404 });
  const bytes = await setupRequestPdf({ date: jstToday(), partner: p, machines: ms }, await pdfAssets());
  return pdfResponse(bytes, `setup-request-${p.partner_code}.pdf`, 'inline');
}
