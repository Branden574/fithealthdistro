import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseUrl } from './env';

/**
 * The service role: bypasses RLS. Server only, and only for the few jobs that need it, such as recording an inquiry
 * after the form has been validated and rate-limited. Never pass its results to a client unfiltered.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set. It belongs in .env.local and in the host’s server environment only.');
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
