'use server';

import { refresh } from 'next/cache';
import { adminClient } from './auth';
import type { InquiryStatus } from './inquiries';
import { UUID } from './product-form';
import { errorCode, logFailure, type QuickResult } from './results';

const STATUSES: readonly string[] = ['new', 'read', 'replied'];

/** A status change, which can also find that someone else moved the inquiry first. */
export type StatusResult = QuickResult | { ok: false; reason: 'changed' };

/**
 * Moves an inquiry to New, Read or Replied, but only while it is still where the admin saw it (`from`). A tab left open
 * cannot undo what another admin did since, and opening an inquiry (`from` New) never undoes a Read or a Replied. The
 * database stamps when it was read and replied to.
 */
export async function setInquiryStatus(id: string, to: InquiryStatus, from: InquiryStatus): Promise<StatusResult> {
  if (typeof id !== 'string' || !UUID.test(id) || !STATUSES.includes(to) || !STATUSES.includes(from)) return { ok: false, reason: 'error' };
  if (to === from) return { ok: true };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('inquiries').update({ status: to }).eq('id', id).eq('status', from).select('id');
    if (error) throw error;
    if (!data.length) {
      const { data: still, error: readError } = await context.supabase.from('inquiries').select('id').eq('id', id).maybeSingle();
      if (readError) throw readError;
      return { ok: false, reason: still ? 'changed' : 'missing' };
    }
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('setInquiryStatus', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Removes an inquiry for good, such as spam. The client and their other inquiries stay. The page that asked moves on to
 * the list itself, so this does not redraw a page whose inquiry is gone.
 */
export async function removeInquiry(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('inquiries').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('removeInquiry', error);
    return { ok: false, reason: 'error' };
  }
}
