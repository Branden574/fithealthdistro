import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabasePublishableKey, supabaseUrl } from './env';

/**
 * A client with no session: it always reads as a visitor (the anon role), whoever is signed in. Use it for everything
 * the storefront shows, so admin drafts can never leak into a public or cached page.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
