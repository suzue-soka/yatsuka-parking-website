# 谷塚駅東口共同駐車場 公式ウェブサイト

Owner: 株式会社鈴江 · Built with Next.js 16 (App Router, JavaScript).

## Stage 1 — public site (this version)
- Home: お知らせ, 料金, 駐車料金シミュレーター, アクセス (Google Maps), 施設, 駐車できる車両, 月極駐車場 (Park Direct), お困りのときは, 提携店舗募集, セキュリティ, FAQ
- `/news`, `/news/[slug]`, `/partners` (directory filled only after each shop agrees to be listed), `/privacy` (placeholder until the lawyer-reviewed policy is ready)
- SEO: titles/descriptions, ParkingFacility structured data, `sitemap.xml`, `robots.txt` (search engines blocked until `ALLOW_INDEXING=true` in production)
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy

Content lives in `lib/site.js` (facts, rates, FAQ) and `lib/news.js` (お知らせ). The fee calculation is `lib/fees.js`, covered by tests in `tests/`.

## Run it on your PC (Windows)
1. Open the project folder in File Explorer, click the address bar, type `cmd` and press Enter. A black window opens in this folder.
2. First time only: `npm install`
3. Start: `npm run dev`
4. Open http://localhost:3000 in your browser. Press `Ctrl + C` in the black window to stop.

Run the tests with `npm test`.

## Deploy (Vercel)
1. Push to GitHub (`suzue-soka/yatsuka-parking-website`, private).
2. In Vercel: **Add New → Project → Import** the repository. Framework: Next.js (detected automatically).
3. Settings → Functions → Region: **Tokyo (hnd1)**.
4. Environment variables:
   - `NEXT_PUBLIC_SITE_URL` = the final address, e.g. `https://parking.example.co.jp` (no trailing slash)
   - `ALLOW_INDEXING` = `true` only when the site is ready to appear in Google
5. Add the domain under Settings → Domains and create the DNS records Vercel shows.

## To do before launch
- Confirm the map pin (`SITE.geo` in `lib/site.js`) and the launch date in `lib/news.js`
- Register the domain; set `NEXT_PUBLIC_SITE_URL`
- Google Business Profile; Search Console with the sitemap
- English and Simplified Chinese versions
- Stage 2: partner portal, admin, Supabase database, ParkingWeb import, invoices, Stripe

## Stage 2 — partner portal & admin (in progress)
- `/login` (email + password) → `/login/mfa` (authenticator app, required for everyone) → `/portal` (partners) or `/admin` (administrator)
- Email links (invitation, password reset) go to `/auth/confirm` and then `/login/password`
- `/admin/import`: upload the ParkingWeb CSV; the original file is kept in private storage, totals are checked, and only new rows are added
- The database refuses all partner/admin data unless the session passed two-step verification (aal2)

Vercel environment variables (Settings → Environment Variables):
- `SUPABASE_SECRET_KEY` = the Supabase **secret** key (`sb_secret_…`), marked Sensitive. Never put it in code or chat.
- Optional overrides: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (defaults are in `lib/supabase/config.js`)
