// Automatic sign-out after inactivity on the partner and admin pages.
// The time of the last activity is kept in a cookie: the server checks it on every
// request (lib/supabase/proxy.js), the browser updates it while the user is active.
export const IDLE_COOKIE = 'yp_seen';
export const IDLE_MS = 30 * 60 * 1000; // 30 minutes
export const IDLE_WARN_MS = 2 * 60 * 1000; // warning shown 2 minutes before
