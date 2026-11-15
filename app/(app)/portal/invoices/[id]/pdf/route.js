import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { createClient, getClaims } from '@/lib/supabase/server';
import { invoicePdf } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let assets; // font and logo, loaded once per server instance
async function loadAssets() {
  if (!assets) {
    const [font, logo] = await Promise.all([
      readFile(path.join(process.cwd(), 'assets/fonts/ipag.ttf')),
      readFile(path.join(process.cwd(), 'public/images/logo-lockup.png')),
    ]);
    assets = { font, logo, fontkit };
  }
  return assets;
}

// PDF download of an invoice. Partners get their own invoices only, admins all (database rules);
// sign-in, 2-step verification and the 30-minute inactivity rule are checked as for every portal page.
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

  const bytes = await invoicePdf(inv, await loadAssets()); // always Japanese
  const name = `${inv.invoice_no}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
