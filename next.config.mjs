/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Content Security Policy: only our own files, Google Maps (embed) and nothing else.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://akwzolwbwbkcogqjyzpa.supabase.co",
  'frame-src https://www.google.com https://maps.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig = {
  poweredByHeader: false,
  // The invoice PDF reads the Japanese font and the logo from disk: ship them with that route.
  outputFileTracingIncludes: {
    '/portal/invoices/**': ['./assets/fonts/ipag.ttf', './public/images/logo-lockup.png', './public/images/stamp.png'],
    '/portal/machines/**': ['./assets/fonts/ipag.ttf', './public/images/logo-lockup.png', './public/images/stamp.png'],
    '/admin/partners/**': ['./assets/fonts/ipag.ttf', './public/images/logo-lockup.png', './public/images/stamp.png'],
    '/admin/setup-request': ['./assets/fonts/ipag.ttf', './public/images/logo-lockup.png', './public/images/stamp.png'],
  },
  // One 404 page for the whole site (the site has a root layout per language).
  experimental: {
    globalNotFound: true,
    // Application documents (4 MB) and ParkingWeb CSVs are uploaded through server actions.
    serverActions: { bodySizeLimit: '5mb' },
  },
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
