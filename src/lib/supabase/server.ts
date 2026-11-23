import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { SESSION_COOKIE } from './cookies';
import type { Database } from './database.types';
import { supabasePublishableKey, supabaseUrl } from './env';

/** A client acting as the signed-in user, from their session cookies. Admin pages, actions and the draft preview use it. */
export async function createSessionClient() {
  // Request time only. Without this, a prefetch could render admin content ahead of the visit with the visitor's cookies,
  // and the session check reads the clock, which a prefetch may not.
  await connection();
  const store = await cookies();
  return createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookieOptions: SESSION_COOKIE,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes the session instead.
        }
      },
    },
  });
}
