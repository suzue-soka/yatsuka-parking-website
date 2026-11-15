import { createClient, getClaims } from '@/lib/supabase/server';
import { deliveryNotePdf } from '@/lib/delivery-note-pdf';
import { pdfAssets, pdfResponse } from '@/lib/pdf/assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 納品書 PDF of a shipment (all machines shipped together under one DN number), found from any
// of its machines. Opens in the browser (to print and put in the parcel); ?download=1 saves it.
// Partners see their own machines only, admins all (database rules).
export async function GET(request, { params }) {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  const { id } = await params;
  const url = new URL(request.url);
  const back = encodeURIComponent(url.pathname + url.search);
  if (!claims) return Response.redirect(new URL(`/login?next=${back}`, request.url), 303);
  if (claims.aal !== 'aal2') return Response.redirect(new URL(`/login/mfa?next=${back}`, request.url), 303);
  if (!/^\d+$/.test(id)) return new Response('Not found', { status: 404 });

  const { data: one } = await supabase.from('machines').select('delivery_note_no, shipped_on').eq('id', id).maybeSingle();
  if (!one?.delivery_note_no) return new Response('Not found', { status: 404 });
  const { data: ms } = await supabase
    .from('machines')
    .select('*, partners(partner_code, name, billing_name, billing_address, address), invoices(invoice_no, invoice_lines(unit_yen))')
    .eq('delivery_note_no', one.delivery_note_no)
    .order('machine_no');
  if (!ms?.length) return new Response('Not found', { status: 404 });

  const first = ms[0];
  const group = {
    delivery_note_no: first.delivery_note_no,
    shipped_on: first.shipped_on,
    carrier: first.carrier,
    tracking_no: first.tracking_no,
    warranty_until: first.warranty_until,
    partners: first.partners,
    invoice_nos: [...new Set(ms.map((m) => m.invoices?.invoice_no).filter(Boolean))],
    machines: ms.map((m) => ({
      machine_code: m.machine_code,
      model: m.model,
      serial_no: m.serial_no,
      discount_codes: m.discount_codes,
      store_nos: m.store_nos,
      unit_yen: m.invoices?.invoice_lines?.[0]?.unit_yen ?? null,
    })),
  };
  const bytes = await deliveryNotePdf(group, await pdfAssets());
  return pdfResponse(bytes, `${first.delivery_note_no}.pdf`, url.searchParams.get('download') ? 'attachment' : 'inline');
}
