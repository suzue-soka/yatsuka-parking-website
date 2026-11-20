// Font, logo and company seal for the PDF documents, read from disk once per server instance.
// (next.config.mjs ships these files with the routes that use them.)
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';

let cached;
export async function pdfAssets() {
  if (!cached) {
    const [font, logo, stamp] = await Promise.all([
      readFile(path.join(process.cwd(), 'assets/fonts/ipag.ttf')),
      readFile(path.join(process.cwd(), 'public/images/logo-lockup-level.png')),
      readFile(path.join(process.cwd(), 'public/images/stamp.png')),
    ]);
    cached = { font, logo, stamp, fontkit };
  }
  return cached;
}

export function pdfResponse(bytes, filename, disposition = 'attachment') {
  const name = filename.replace(/[^A-Za-z0-9._-]/g, '_');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
