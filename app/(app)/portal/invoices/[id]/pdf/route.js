import { createClient, getClaims } from '@/lib/supabase/server';
import { invoicePdf } from '@/lib/invoice-pdf';
import { pdfAssets, pdfResponse } from '@/lib/pdf/assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PDF download of an invoice, always in Japanese. Partners get their own invoices only, admins all
// (database rules); sign-in, 2-step verification and the inactivity rule apply as on every portal page.
export async function GET(request, { params }) {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  const { id } = await params;
  const back = encodeURIComponent(`/portal/invoices/${id}`);
  if (!claims) return Response.redirect(new URL(`/login?next=${back}`, request.url), 303);
  if (claims.aal !== 'aal2') return Response.redirect(new URL(`/login/mfa?next=${back}`, request.url), 303);

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, invoice_lines(description, quantity, unit_yen, amount_yen), partners(partner_code, name, billing_name, billing_address, address)')
    .eq('id', id)
    .maybeSingle();
  if (!inv) return new Response('Not found', { status: 404 });
  const { data: orig } = inv.kind === 'cancellation' && inv.cancels_invoice_id
    ? await supabase.from('invoices').select('invoice_no, issued_on').eq('id', inv.cancels_invoice_id).maybeSingle()
    : { data: null };
  // ?view=1 opens it in the browser instead of saving it.
  const view = new URL(request.url).searchParams.get('view');
  return pdfResponse(await invoicePdf(inv, await pdfAssets(), 'ja', orig), `${inv.invoice_no}.pdf`, view ? 'inline' : 'attachment');
}
