// Daily overdue job (Vercel cron → /api/cron/overdue). Server only.
import { planReminders, todayJst } from '@/lib/reminder-plan';
import { overdueMail, overdueListMail } from '@/lib/content/mail';
import { sendMail, mailConfigured } from '@/lib/mail';

const STAGE_JA = { 1: '1回目を送信', 2: '2回目を送信' };

export async function runOverdueJob(admin, { origin, now = new Date() }) {
  const today = todayJst(now);
  const { data: invs, error } = await admin
    .from('invoices')
    .select('id, invoice_no, kind, total_yen, due_on, partner_id, partners(partner_code, name, email, applied_lang), payments(amount_yen)')
    .eq('status', 'published')
    .neq('kind', 'cancellation')
    .lt('due_on', today);
  if (error) throw new Error(error.message);
  const list = (invs || []).map((i) => ({ ...i, paid_yen: (i.payments || []).reduce((s, p) => s + Number(p.amount_yen || 0), 0) }));

  const ids = list.map((i) => i.id);
  const { data: rem } = ids.length
    ? await admin.from('invoice_reminders').select('invoice_id, stage').in('invoice_id', ids)
    : { data: [] };
  const sent = new Set((rem || []).map((r) => `${r.invoice_id}:${r.stage}`));
  const { overdue, send } = planReminders(list, sent, today);

  const partnerIds = [...new Set(send.map((s) => s.invoice.partner_id))];
  const { data: profs } = partnerIds.length
    ? await admin.from('profiles').select('partner_id, preferred_lang').in('partner_id', partnerIds)
    : { data: [] };

  const status = {}; // invoice id → text for the owner's list
  const errors = [];
  for (const { invoice: i, stage, alsoMark } of send) {
    const p = i.partners || {};
    let note = null;
    try {
      if (!p.email) {
        note = 'no email address';
      } else {
        const lang = (profs || []).find((x) => x.partner_id === i.partner_id)?.preferred_lang || p.applied_lang || 'ja';
        await sendMail({
          to: p.email,
          ...overdueMail(lang, {
            name: p.name,
            code: p.partner_code,
            invoiceNo: i.invoice_no,
            total: i.total_yen,
            paid: i.paid_yen,
            rest: i.rest,
            due: i.due_on,
            stage,
            url: `${origin}/portal/invoices/${i.id}`,
          }),
        });
      }
      // Record it (also when there is no address, so it isn't retried every day). A send error is retried tomorrow.
      const rows = [stage, ...alsoMark].map((s) => ({ invoice_id: i.id, stage: s, note: s === stage ? note : 'skipped (later reminder sent)' }));
      const { error: e2 } = await admin.from('invoice_reminders').upsert(rows, { onConflict: 'invoice_id,stage', ignoreDuplicates: true });
      if (e2) throw new Error(e2.message);
      status[i.id] = note ? `${STAGE_JA[stage].replace('を送信', '')}：メールアドレスなし` : STAGE_JA[stage];
    } catch (e) {
      errors.push(`${i.invoice_no}: ${e.message}`);
      status[i.id] = `送信エラー（${e.message}）`;
    }
  }

  // Daily list to 鈴江 — only on days with overdue invoices.
  let listSent = false;
  if (overdue.length && mailConfigured()) {
    const to = (process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || '').trim();
    if (to) {
      await sendMail({
        to,
        ...overdueListMail({
          today,
          url: `${origin}/admin/billing?unpaid=1#issued`,
          rows: overdue.map((i) => ({
            code: i.partners?.partner_code,
            name: i.partners?.name,
            no: i.invoice_no,
            due: i.due_on,
            late: i.late,
            rest: i.rest,
            sent: status[i.id],
          })),
        }),
      });
      listSent = true;
    }
  }
  return { today, overdue: overdue.length, reminders: send.length, errors, listSent };
}
