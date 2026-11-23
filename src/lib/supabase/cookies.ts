import type { CookieOptionsWithName } from '@supabase/ssr';

/**
 * How the admin session cookie is set, the same in the proxy and on the server. Scripts in the page cannot read it
 * (httpOnly): the admin never talks to Supabase from the browser, so nothing there needs the session, and a script
 * injected into a page could not lift it. Sent only over HTTPS in production, and kept off cross-site requests.
 */
export const SESSION_COOKIE: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};
