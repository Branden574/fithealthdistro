import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createSessionClient } from '@/lib/supabase/server';
import { SIGN_IN_PATH } from './paths';

export interface Admin {
  id: string;
  email: string;
  /** Their name, or their email when no name was given. */
  name: string;
  /** Signed in with the password another admin set for them, which they should replace. */
  temporaryPassword: boolean;
}

/**
 * The signed-in admin, or null. Signing in is not enough: the user must also be on the allowlist, which is read as that
 * user, so the database's own rules decide. Checked once per request and shared by everything that asks.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createSessionClient();
  // getClaims verifies the session token; the cookie alone could be forged.
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  // Set by the server when another admin creates the account, and cleared once they choose their own password.
  const temporaryPassword = data.claims.app_metadata?.temporary_password === true;
  const { data: row, error } = await supabase.from('admins').select('user_id, email, name').eq('user_id', id).maybeSingle();
  if (error) throw new Error(`Could not read the admin list: ${error.message}`);
  return row ? { id: row.user_id, email: row.email, name: row.name.trim() || row.email, temporaryPassword } : null;
});

/** For admin pages: the admin, or a trip to the sign-in page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(SIGN_IN_PATH);
  return admin;
}

/**
 * For admin actions: a client acting as the admin, or null when the session has ended or the user is no longer an
 * admin. The database checks the allowlist again on every write.
 */
export async function adminClient() {
  const admin = await getAdmin();
  if (!admin) return null;
  return { admin, supabase: await createSessionClient() };
}
