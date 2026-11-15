import { createClient, getClaims } from '@/lib/supabase/server';
import { deliveryNotePdf } from '@/lib/delivery-note-pdf';
import { pdfAssets, pdfResponse } from '@/lib/pdf/assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 納品書 PDF of a shipped machine. Opens in the browser (to print and put in the parcel);
// ?download=1 saves it instead. Partners see their own machines only, admins all.
export async function GET(request, { params }) {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  const { id } = await params;
  const url = new URL(request.url);
  const back = encodeURIComponent(url.pathname + url.search);
  if (!claims) return Response.redirect(new URL(`/login?next=${back}`, request.url), 303);
  if (claims.aal !== 'aal2') return Response.redirect(new URL(`/login/mfa?next=${back}`, request.url), 303);
  if (!/^\d+$/.test(id)) return new Response('Not found', { status: 404 });

  const { data: m } = await supabase
    .from('machines')
    .select(
      '*, partners(partner_code, name, billing_name, billing_address, address), invoices(invoice_no, total_yen, tax_yen, invoice_lines(description, quantity, unit_yen, amount_yen))',
    )
    .eq('id', id)
    .maybeSingle();
  if (!m || !m.shipped_on) return new Response('Not found', { status: 404 });
  const bytes = await deliveryNotePdf(m, await pdfAssets());
  return pdfResponse(bytes, `${m.delivery_note_no || `DN-${m.id}`}.pdf`, url.searchParams.get('download') ? 'attachment' : 'inline');
}
