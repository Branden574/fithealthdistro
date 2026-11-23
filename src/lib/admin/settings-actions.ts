'use server';

import { randomInt } from 'node:crypto';
import { refresh, updateTag } from 'next/cache';
import { CATALOG_TAG } from '@/lib/catalog';
import type { Database } from '@/lib/supabase/database.types';
import { createSessionClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { adminClient, getAdmin } from './auth';
import { UUID } from './product-form';
import { errorCode, logFailure, type QuickResult } from './results';
import {
  readAddAdminForm,
  readContactForm,
  readNameForm,
  readPasswordForm,
  type AddAdminState,
  type ContactFormState,
  type NameFormState,
  type PasswordFormState,
} from './settings-form';

/** The email and phone in the storefront's footer. They show as soon as they are saved. */
export async function saveContactDetails(previous: ContactFormState, form: FormData): Promise<ContactFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readContactForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { data, error } = await context.supabase
      .from('business_settings')
      .update({ public_email: read.email, public_phone: read.phone })
      .eq('id', 1)
      .select('id');
    if (error) throw error;
    if (!data.length) throw new Error('The settings row is missing.');
    // The footer reads them through the cached catalog read.
    updateTag(CATALOG_TAG);
    refresh();
    return { status: 'saved', attempt };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('saveContactDetails', error);
    return { status: 'error', attempt };
  }
}

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';

/** 18 characters with each kind the password rules ask for, from the system's secure random source. No look-alikes. */
function temporaryPassword(): string {
  const all = UPPER + LOWER + DIGITS;
  const chars = [UPPER, LOWER, DIGITS].map((set) => set[randomInt(set.length)]);
  while (chars.length < 18) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Lets someone into the admin. Someone who already has an account signs in as before. For anyone else this makes the
 * account, with a temporary password that is returned once for the admin to pass on privately, and that the new admin
 * is asked to replace. Signing up is closed, so this is the only way in.
 */
export async function addAdmin(previous: AddAdminState, form: FormData): Promise<AddAdminState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readAddAdminForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  let created: string | null = null;
  const service = createServiceClient();
  try {
    // Checked before the service role is used for anything.
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { data: found, error: findError } = await service.rpc('find_user_id', { p_email: read.email });
    if (findError) throw findError;
    let userId = found;
    let password: string | undefined;
    if (userId) {
      const { data: already, error } = await context.supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (already) return { status: 'invalid', errors: { email: 'They are already an admin.' }, attempt };
    } else {
      password = temporaryPassword();
      const { data, error } = await service.auth.admin.createUser({
        email: read.email,
        password,
        email_confirm: true,
        app_metadata: { temporary_password: true },
      });
      if (error) {
        if (error.code === 'email_exists') return { status: 'invalid', errors: { email: 'That account was just made elsewhere. Try again.' }, attempt };
        throw error;
      }
      userId = data.user.id;
      created = userId;
    }
    // As the admin, so the allowlist's own rules check this insert too. The email is not sent: a trigger copies it from
    // the account, and the grant refuses it from the caller. The generated types do not know about the trigger.
    const row = { user_id: userId, name: read.name } as Database['public']['Tables']['admins']['Insert'];
    const { error: insertError } = await context.supabase.from('admins').insert(row);
    if (insertError) throw insertError;
    created = null;
    refresh();
    return { status: 'added', attempt, name: read.name, email: read.email, password };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('addAdmin', error);
    return { status: 'error', attempt };
  } finally {
    // An account made for an admin who could not be added is not left behind.
    if (created) {
      // The client answers with an error rather than throwing, so both are checked.
      const cleanup = await service.auth.admin.deleteUser(created).catch((error: unknown) => ({ error }));
      if (cleanup.error) logFailure('addAdmin cleanup: an account was left without an admin row', cleanup.error);
    }
  }
}

/** Takes someone off the allowlist. Their account stays, but it opens nothing. The last admin cannot be removed. */
export async function removeAdmin(id: string): Promise<QuickResult | { ok: false; reason: 'self' | 'last' }> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    if (id === context.admin.id) return { ok: false, reason: 'self' };
    const { data, error } = await context.supabase.from('admins').delete().eq('user_id', id).select('user_id');
    if (error) {
      if (errorCode(error) === 'P0001') return { ok: false, reason: 'last' };
      throw error;
    }
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('removeAdmin', error);
    return { ok: false, reason: 'error' };
  }
}

/** The signed-in admin's own name, as the admin shows it. */
export async function saveMyName(previous: NameFormState, form: FormData): Promise<NameFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readNameForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { data, error } = await context.supabase.from('admins').update({ name: read.name }).eq('user_id', context.admin.id).select('user_id');
    if (error) throw error;
    if (!data.length) return { status: 'signed-out', attempt };
    refresh();
    return { status: 'saved', attempt };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('saveMyName', error);
    return { status: 'error', attempt };
  }
}

/**
 * Changes the signed-in admin's password. The current one is checked by signing in with it, which also counts as the
 * recent sign-in the auth service asks for before a password changes. A few tries per quarter hour.
 */
export async function changePassword(previous: PasswordFormState, form: FormData): Promise<PasswordFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readPasswordForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  try {
    const admin = await getAdmin();
    if (!admin) return { status: 'signed-out', attempt };
    const service = createServiceClient();
    const { data: allowed, error: limitError } = await service.rpc('take_rate_limit', {
      p_bucket: `password:${admin.id}`,
      p_limit: 5,
      p_window_seconds: 15 * 60,
    });
    if (limitError) throw limitError;
    if (!allowed) return { status: 'limited', attempt };

    const supabase = await createSessionClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: admin.email, password: read.current });
    if (signInError) {
      if (signInError.code === 'invalid_credentials') return { status: 'invalid', errors: { current: 'That is not your current password.' }, attempt };
      if (signInError.code === 'over_request_rate_limit') return { status: 'limited', attempt };
      throw signInError;
    }
    const { error } = await supabase.auth.updateUser({ password: read.next });
    if (error) {
      if (error.code === 'weak_password') return { status: 'invalid', errors: { next: 'The sign-in service finds that password too easy to guess. Choose another.' }, attempt };
      if (error.code === 'same_password') return { status: 'invalid', errors: { next: 'Choose a password different from the one you have now.' }, attempt };
      throw error;
    }
    if (admin.temporaryPassword) {
      // The password has changed by now. If clearing the reminder fails, it shows until the next change; the answer is
      // still that the password changed, because it did.
      try {
        const { error: flagError } = await service.auth.admin.updateUserById(admin.id, { app_metadata: { temporary_password: null } });
        if (flagError) throw flagError;
        // A fresh token, so the reminder goes away now rather than when the session next renews.
        await supabase.auth.refreshSession();
      } catch (flagError) {
        logFailure('changePassword: clearing the temporary-password reminder', flagError);
      }
    }
    refresh();
    return { status: 'saved', attempt };
  } catch (error) {
    logFailure('changePassword', error);
    return { status: 'error', attempt };
  }
}
