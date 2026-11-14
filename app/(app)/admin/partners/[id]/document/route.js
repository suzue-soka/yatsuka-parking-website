import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';

// Short-lived link to an applicant's document (private bucket, admins only).
export async function GET(request, { params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const { data: p } = await supabase.from('partners').select('doc_path').eq('id', id).single();
  if (!p?.doc_path) return new NextResponse('Not found', { status: 404 });
  const { data, error } = await supabase.storage.from('applications').createSignedUrl(p.doc_path, 600);
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
