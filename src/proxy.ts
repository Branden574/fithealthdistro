import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_HOME, SIGN_IN_PATH } from '@/lib/admin/paths';
import { SESSION_COOKIE } from '@/lib/supabase/cookies';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';

/**
 * Runs before every admin and draft-preview request. It keeps the admin's session fresh (Server Components cannot write cookies) and sends
 * anyone without a valid session to sign in. This is the first gate only: every admin page and action checks the
 * allowlist again on the server, so a missed path here never opens anything.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookieOptions: SESSION_COOKIE,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        // Keeps a response that refreshed the session out of every shared cache.
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Verifies the token's signature, and refreshes it when it has expired. Never trust the cookie without this.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  // Only page visits are sent to sign in. A form or action posted from a tab left open after signing out goes on to the
  // action, which checks the session itself and answers "Your session ended" in place; a redirect here would hand it a
  // web page instead of an answer, and the tab would fail.
  const visit = request.method === 'GET' || request.method === 'HEAD';
  if (!signedIn && visit && path !== SIGN_IN_PATH) {
    const to = request.nextUrl.clone();
    to.pathname = SIGN_IN_PATH;
    to.search = path === ADMIN_HOME ? '' : `?next=${encodeURIComponent(path)}`;
    const redirect = NextResponse.redirect(to);
    // Carry any cookie the check just cleared or refreshed, and its cache headers.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/preview', '/preview/:path*'],
};
