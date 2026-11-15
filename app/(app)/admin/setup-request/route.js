import { requireAdmin } from '@/lib/admin-guard';
import { setupRequestPdf } from '@/lib/setup-request-pdf';
import { pdfAssets, pdfResponse } from '@/lib/pdf/assets';
import { jstToday } from '@/lib/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin only: one setup request for all machines waiting to be ordered from Amano (all partners).
// ?ids=1,2,3 limits it to exactly the machines listed on the dashboard.
export async function GET(request) {
  const { supabase } = await requireAdmin();
  const ids = (new URL(request.url).searchParams.get('ids') || '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  let q = supabase
    .from('machines')
    .select('machine_code, discount_codes, store_nos')
    .not('machine_code', 'is', null)
    .is('shipped_on', null)
    .is('cancelled_at', null)
    .order('machine_code');
  q = ids.length ? q.in('id', ids) : q.is('amano_ordered_on', null);
  const { data: ms } = await q;
  if (!ms?.length) return new Response('Not found', { status: 404 });
  const date = jstToday();
  return pdfResponse(await setupRequestPdf({ date, machines: ms }, await pdfAssets()), `setup-request-${date}.pdf`, 'inline');
}
