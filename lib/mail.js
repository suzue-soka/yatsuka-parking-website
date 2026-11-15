// Server-only email sender (Gmail SMTP with an app password).
// Vercel environment variables, added by the owner (never put the password in code or chat):
//   SMTP_USER  the Gmail address, e.g. suzue.soka@gmail.com
//   SMTP_PASS  a Google app password for that address (16 letters; spaces are ignored)
import nodemailer from 'nodemailer';

const clean = (v) => String(v || '').trim().replace(/^['"]|['"]$/g, '');
const user = () => clean(process.env.SMTP_USER);
const pass = () => clean(process.env.SMTP_PASS).replace(/\s+/g, '');

export const FROM_NAME = '谷塚駅東口共同駐車場（株式会社鈴江）';

export function mailConfigured() {
  return Boolean(user() && pass());
}

export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured()) throw new Error('SMTP_USER / SMTP_PASS not set in Vercel');
  const transport = nodemailer.createTransport({
    host: clean(process.env.SMTP_HOST) || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: user(), pass: pass() },
  });
  await transport.sendMail({ from: { name: FROM_NAME, address: user() }, replyTo: user(), to, subject, text, html });
}
