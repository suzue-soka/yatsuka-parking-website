// Monthly invoices: drafting after the ParkingWeb import, publishing, and emails (server only).
import { jstToday } from '@/lib/dates';
import { dueDate, monthEnd, addMonths } from '@/lib/holidays';
import { sendMail } from '@/lib/mail';
import { monthlyInvoiceMail } from '@/lib/content/mail';

/** The month billed now: the month before today (JST), as 'YYYY-MM-01'. */
export const billingMonth = (today = jstToday()) => addMonths(`${today.slice(0, 7)}-01`, -1);

/**
 * After a successful import: create the previous month's drafts once the imported data reaches the
 * end of that month; publish them at once when "publish automatically" is on.
 * `admin` is the service-role client. Returns { status, month, count?, mailErrors? }.
 */
export async function draftAfterImport(admin, { runId, periodTo, origin }) {
  const today = jstToday();
  const month = billingMonth(today);
  const { data: done } = await admin.from('billing_runs').select('month').eq('month', month).maybeSingle();
  if (done) return { status: 'already', month };
  const covered = periodTo ? new Date(periodTo).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }) : null;
  if (!covered || covered < monthEnd(month)) return { status: 'incomplete', month, covered };

  const due = dueDate(today);
  const { data: count, error } = await admin.rpc('create_monthly_drafts', { p_month: month, p_issued: today, p_due: due, p_import_run: runId });
  if (error) return { status: 'error', month, error: error.message };
  const { data: settings } = await admin.from('billing_settings').select('auto_publish').eq('id', 1).single();
  if (!settings?.auto_publish || !count) return { status: 'drafted', month, count };
  const res = await publishAndNotify(admin, { month, issued: today, due, ids: null, origin });
  return { status: 'published', month, count: res.published, mailErrors: res.mailErrors, error: res.error };
}

/** Publish the month's drafts (all or `ids`) and email each partner. */
export async function publishAndNotify(client, { month, issued, due, ids, origin }) {
  const { data: published, error } = await client.rpc('publish_monthly_invoices', { p_month: month, p_issued: issued, p_due: due, p_ids: ids });
  if (error) return { published: 0, mailErrors: [], error: error.message };
  const list = (published || []).map((r) => (typeof r === 'string' ? r : r.publish_monthly_invoices));
  const mailErrors = [];
  if (list.length) {
    const { data: invs } = await client
      .from('invoices')
      .select('id, invoice_no, total_yen, due_on, partner_id, partners(name, email, applied_lang)')
      .in('id', list);
    const { data: profs } = await client.from('profiles').select('partner_id, preferred_lang').in('partner_id', (invs || []).map((i) => i.partner_id));
    for (const i of invs || []) {
      const p = i.partners || {};
      try {
        if (!p.email) throw new Error('no email address');
        const lang = (profs || []).find((x) => x.partner_id === i.partner_id)?.preferred_lang || p.applied_lang || 'ja';
        const mail = monthlyInvoiceMail(lang, {
          name: p.name,
          month: month.slice(0, 7),
          invoiceNo: i.invoice_no,
          total: i.total_yen,
          due: i.due_on,
          url: `${origin}/portal/invoices/${i.id}`,
        });
        await sendMail({ to: p.email, ...mail });
      } catch (e) {
        mailErrors.push(`${p.name || i.invoice_no}: ${e.message}`);
      }
    }
  }
  return { published: list.length, mailErrors };
}
