'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient, getClaims } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseReport } from '@/lib/parkingweb';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';

const MAX_BYTES = 5 * 1024 * 1024;

export async function importCsv(prevState, formData) {
  const E = appText(await getAppLang()).import.errors;

  // 1. Only a verified administrator may import.
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  if (!claims || claims.aal !== 'aal2') return { error: E.relogin };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', claims.sub).single();
  if (profile?.role !== 'admin') return { error: E.forbidden };

  // 2. Read and check the file.
  const file = formData.get('file');
  if (!file || typeof file === 'string' || file.size === 0) return { error: E.noFile };
  if (file.size > MAX_BYTES) return { error: E.tooBig };
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const report = parseReport(new TextDecoder('shift_jis').decode(bytes));

  const admin = createAdminClient();

  // 3. Keep the original file (private storage, never overwritten).
  const month = report.period?.from?.slice(0, 7) || 'unknown';
  const path = `${month}/${new Date().toISOString().replace(/[:.]/g, '-')}-${sha256.slice(0, 12)}.csv`;
  const { error: upErr } = await admin.storage.from('parkingweb').upload(path, bytes, { contentType: 'text/csv', upsert: false });
  if (upErr) return { error: E.storage(upErr.message) };

  // 4. Unknown 店No. are reported (their rows are stored but not billed until mapped).
  const { data: stores } = await admin.from('store_numbers').select('store_no');
  const known = new Set((stores || []).map((s) => s.store_no));
  const unknown = [...new Set(report.rows.map((r) => r.storeNo).filter((n) => !known.has(n)))].sort((a, b) => a - b);

  const base = {
    period_from: report.period?.from ?? null,
    period_to: report.period?.to ?? null,
    file_sha256: sha256,
    file_path: path,
    rows_in_file: report.rows.length,
    file_total_count: report.total?.count ?? null,
    file_total_yen: report.total?.amount ?? null,
  };

  // 5. Blocking problems: nothing is imported, the run is recorded for review.
  if (report.problems.length) {
    await admin.from('import_runs').insert({ ...base, status: 'blocked', finished_at: new Date().toISOString(), message: report.problems.slice(0, 10).join(' / ') });
    revalidatePath('/admin');
    return { error: E.blocked, problems: report.problems.slice(0, 20) };
  }

  const { data: run, error: runErr } = await admin.from('import_runs').insert({ ...base, status: 'running' }).select('id').single();
  if (runErr) return { error: E.start(runErr.message) };

  // 6. Count-based import: only rows not already stored are added.
  const { data: result, error: impErr } = await admin.rpc('import_validations', { p_run_id: run.id, p_rows: report.rows });
  if (impErr) {
    await admin.from('import_runs').update({ status: 'failed', finished_at: new Date().toISOString(), message: impErr.message }).eq('id', run.id);
    return { error: E.failed(impErr.message) };
  }
  const { added, already_present } = result?.[0] || { added: 0, already_present: 0 };
  const message = unknown.length ? `未登録の店No.：${unknown.join('、')}（請求対象外）` : null;
  await admin.from('import_runs').update({ status: 'ok', finished_at: new Date().toISOString(), rows_added: added, rows_already_present: already_present, message }).eq('id', run.id);
  await admin.from('audit_log').insert({ actor: claims.sub, action: 'import_parkingweb', entity: 'import_run', entity_id: String(run.id), detail: { file: file.name, sha256, added, already_present } });

  revalidatePath('/admin');
  return {
    ok: true,
    period: report.period,
    rows: report.rows.length,
    totalCount: report.total?.count,
    totalYen: report.total?.amount,
    added,
    alreadyPresent: already_present,
    unknown,
  };
}
