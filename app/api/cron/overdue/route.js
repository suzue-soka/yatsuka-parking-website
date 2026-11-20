// Daily at 09:00 JST (vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>";
// CRON_SECRET is a Vercel environment variable added by the owner. Without it the job refuses to run.
import { createAdminClient } from '@/lib/supabase/admin';
import { runOverdueJob } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yatsuka-parking.jp').replace(/\/$/, '');
    const result = await runOverdueJob(createAdminClient(), { origin });
    console.log('overdue job', JSON.stringify(result));
    return Response.json(result);
  } catch (e) {
    console.error('overdue job failed', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
