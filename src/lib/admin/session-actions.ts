'use server';

import { redirect } from 'next/navigation';
import { addressHash } from '@/lib/net/address';
import { createServiceClient } from '@/lib/supabase/service';
import { createSessionClient } from '@/lib/supabase/server';
import { afterSignIn, SIGN_IN_PATH } from './paths';

export interface SignInState {
  status: 'idle' | 'invalid' | 'wrong' | 'denied' | 'limited' | 'error';
  /** Sent back so a failed attempt keeps the email. Never the password. */
  email?: string;
  errors?: { email?: string; password?: string };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Ten tries from one address (one IPv6 /64) in fifteen minutes. If the host passed no address, every such request
 * shares one stricter allowance rather than none. Supabase Auth adds its own limits behind this; the strong password
 * rule (and two-step sign-in, if turned on) is what actually stops guessing, since Auth can also be reached directly.
 */
async function underLimit(): Promise<boolean> {
  const address = await addressHash();
  const { data, error } = await createServiceClient().rpc('take_rate_limit', {
    p_bucket: `sign-in:ip:${address ?? 'unknown'}`,
    p_limit: address ? 10 : 30,
    p_window_seconds: 15 * 60,
  });
  if (error) throw new Error(`Could not check the sign-in limit: ${error.message}`);
  return data === true;
}

/** Signs an admin in with email and password. Anyone not on the allowlist is signed straight back out. */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const rawEmail = form.get('email');
  const rawPassword = form.get('password');
  // Bounded before anything else looks at them.
  const email = typeof rawEmail === 'string' && rawEmail.length <= 320 ? rawEmail.trim().toLowerCase() : '';
  const password = typeof rawPassword === 'string' && rawPassword.length <= 200 ? rawPassword : '';

  const errors: SignInState['errors'] = {};
  if (!EMAIL.test(email) || email.length > 254) errors.email = 'Enter the email you sign in with.';
  if (!password) errors.password = 'Enter your password.';
  if (errors.email || errors.password) return { status: 'invalid', email, errors };

  let destination: string;
  try {
    if (!(await underLimit())) return { status: 'limited', email };

    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      if (error?.code === 'over_request_rate_limit') return { status: 'limited', email };
      // One answer for a wrong password, an unknown email and an unconfirmed one, so the form does not reveal accounts.
      return { status: 'wrong', email };
    }

    const { data: admin, error: listError } = await supabase.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (listError || !admin) {
      await supabase.auth.signOut({ scope: 'local' });
      return listError ? { status: 'error', email } : { status: 'denied', email };
    }
    destination = afterSignIn(form.get('next'));
  } catch (error) {
    console.error(`signIn failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return { status: 'error', email };
  }
  // Outside the try: redirect works by throwing.
  redirect(destination);
}

/** Ends this session (other devices stay signed in) and returns to the sign-in page. */
export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect(SIGN_IN_PATH);
}
