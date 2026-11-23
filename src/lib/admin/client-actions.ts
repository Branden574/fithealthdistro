'use server';

import { refresh } from 'next/cache';
import { adminClient } from './auth';
import { readActivityForm, readClientForm, type ClientFormState } from './client-form';
import { dayIn, noonOn } from './format';
import { UUID } from './product-form';
import { errorCode, logFailure, type QuickResult } from './results';
import { adminTimeZone } from './time';

/** Corrects a client's name, company or phone. Their email is how they are known, so it does not change here. */
export async function saveClient(previous: ClientFormState, form: FormData): Promise<ClientFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readClientForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { data, error } = await context.supabase
      .from('clients')
      .update({ name: read.name, company: read.company, phone: read.phone })
      .eq('id', read.id)
      .select('id');
    if (error) throw error;
    if (!data.length) return { status: 'missing', attempt };
    refresh();
    return { status: 'saved', attempt };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('saveClient', error);
    return { status: 'error', attempt };
  }
}

/** Records that a client wants no more marketing email. Only the client can opt in again, from the contact form. */
export async function stopMarketing(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('clients').update({ marketing_opt_in: false }).eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('stopMarketing', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Records something the client did outside the website: a call or a visit, or an order with its total. Both count toward
 * retention; orders also count toward sales and conversion.
 */
export async function recordActivity(previous: ClientFormState, form: FormData): Promise<ClientFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  try {
    const zone = await adminTimeZone();
    const now = new Date();
    const today = dayIn(now, zone);
    const read = readActivityForm(form, today);
    if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    const { error } = await context.supabase.from('client_activity').insert({
      client_id: read.clientId,
      kind: read.kind,
      amount: read.kind === 'order' ? read.amount : null,
      note: read.note,
      // Today keeps the time it was recorded; an earlier day is filed at noon on that day, the admin's time.
      occurred_at: (read.day === today ? now : noonOn(read.day, zone)).toISOString(),
      created_by: context.admin.id,
    });
    if (error) {
      if (errorCode(error) === '23503') return { status: 'missing', attempt };
      throw error;
    }
    refresh();
    return { status: 'saved', attempt };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('recordActivity', error);
    return { status: 'error', attempt };
  }
}

/** Removes activity or an order recorded by hand. Activity from an inquiry stays while the inquiry does. */
export async function removeActivity(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('client_activity').delete().eq('id', id).in('kind', ['manual', 'order']).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('removeActivity', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Removes a client and everything they sent, such as when they ask to be forgotten. The page that asked moves on to the
 * list itself, so this does not redraw a page whose client is gone.
 */
export async function removeClient(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('clients').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('removeClient', error);
    return { ok: false, reason: 'error' };
  }
}
