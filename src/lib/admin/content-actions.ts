'use server';

import { refresh, updateTag } from 'next/cache';
import { STOREFRONT_CONTENT_TAG } from '@/lib/content/storefront';
import { adminClient } from './auth';
import { HEADLINE_KEY, HIGHLIGHT_KEY, slotProblem, tidyDraft, type SlotRule } from './copy-rules';
import { FAQ_LIMITS } from './faq-changes';
import { UUID } from './product-form';
import { errorCode, logFailure, type QuickResult } from './results';

type Problem = 'signed-out' | 'error';

export type CopySaveResult = { ok: true; saved: number } | { ok: false; reason: 'invalid'; problems: Record<string, string> } | { ok: false; reason: Problem };

const MAX_SLOTS_PER_SAVE = 300;

/**
 * Saves page-copy drafts: every edit in one go, or none. Visitors see nothing new until Publish. Each draft is checked
 * against its slot's rules here, whatever the editor in the browser said.
 */
export async function saveCopyDrafts(drafts: Record<string, string>): Promise<CopySaveResult> {
  if (!drafts || typeof drafts !== 'object' || Array.isArray(drafts)) return { ok: false, reason: 'error' };
  const entries = Object.entries(drafts);
  if (!entries.length) return { ok: true, saved: 0 };
  if (entries.length > MAX_SLOTS_PER_SAVE || entries.some(([key, text]) => typeof key !== 'string' || typeof text !== 'string' || text.length > 8000)) {
    return { ok: false, reason: 'error' };
  }
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data: rows, error: readError } = await context.supabase.from('site_content').select('key, original, max_length, multiline, optional, draft');
    if (readError) throw readError;
    const rules = new Map<string, SlotRule & { draft: string }>(
      rows.map((row) => [row.key, { key: row.key, original: row.original, max: row.max_length, multiline: row.multiline, optional: row.optional, draft: row.draft }]),
    );

    const tidy: Record<string, string> = {};
    const problems: Record<string, string> = {};
    for (const [key, text] of entries) {
      const rule = rules.get(key);
      if (!rule) problems[key] = 'This text is no longer on the site. Reload the page.';
      else tidy[key] = tidyDraft(text, rule.multiline);
    }
    // Every slot's text once this save lands, for the rule that checks the highlight against the headline.
    const after: Record<string, string> = Object.fromEntries([...rules].map(([key, rule]) => [key, tidy[key] ?? rule.draft]));
    for (const [key, text] of Object.entries(tidy)) {
      const problem = slotProblem(rules.get(key)!, text, after);
      if (problem) problems[key] = problem;
    }
    // A new headline can strand the highlighted words even when the highlight itself was not edited.
    const highlight = rules.get(HIGHLIGHT_KEY);
    if (HEADLINE_KEY in tidy && highlight && !(HIGHLIGHT_KEY in tidy)) {
      const problem = slotProblem(highlight, after[HIGHLIGHT_KEY], after);
      if (problem) problems[HIGHLIGHT_KEY] = problem;
    }
    if (Object.keys(problems).length) return { ok: false, reason: 'invalid', problems };

    const { data: saved, error } = await context.supabase.rpc('save_copy_drafts', { p_drafts: tidy });
    if (error) throw error;
    refresh();
    return { ok: true, saved: saved ?? 0 };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('saveCopyDrafts', error);
    return { ok: false, reason: 'error' };
  }
}

/** Puts every saved page-copy draft back to what visitors see now. FAQ drafts are not touched. */
export async function discardCopyDrafts(): Promise<{ ok: true; discarded: number } | { ok: false; reason: Problem }> {
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error: readError } = await context.supabase.from('site_content_editor').select('key, published').eq('unpublished', true);
    if (readError) throw readError;
    const back = Object.fromEntries(data.filter((row) => row.key && row.published != null).map((row) => [row.key!, row.published!]));
    if (!Object.keys(back).length) return { ok: true, discarded: 0 };
    const { data: count, error } = await context.supabase.rpc('save_copy_drafts', { p_drafts: back });
    if (error) throw error;
    refresh();
    return { ok: true, discarded: count ?? 0 };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('discardCopyDrafts', error);
    return { ok: false, reason: 'error' };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// FAQs: every change here is a draft. Visitors see the published list until Publish.
// ---------------------------------------------------------------------------------------------------------------

export interface FaqFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'missing' | 'error';
  errors?: { question?: string; answer?: string };
  attempt: number;
  isNew?: boolean;
  question?: string;
}

function readFaqForm(form: FormData) {
  const rawId = form.get('id');
  const id = typeof rawId === 'string' && UUID.test(rawId) ? rawId : null;
  const rawQuestion = form.get('question');
  const rawAnswer = form.get('answer');
  const question = typeof rawQuestion === 'string' ? tidyDraft(rawQuestion.slice(0, 4000), false) : '';
  const answer = typeof rawAnswer === 'string' ? tidyDraft(rawAnswer.slice(0, 16000), true) : '';
  const visible = form.get('visible') === 'on';
  const errors: NonNullable<FaqFormState['errors']> = {};
  if (!question) errors.question = 'Write the question.';
  else if (question.length > FAQ_LIMITS.question) errors.question = `Keep the question to ${FAQ_LIMITS.question} characters. It has ${question.length}.`;
  if (answer.length > FAQ_LIMITS.answer) errors.answer = `Keep the answer to ${FAQ_LIMITS.answer} characters. It has ${answer.length}.`;
  return { id, question, answer, visible, errors, ok: !errors.question && !errors.answer };
}

/** Adds a question or saves changes to one, as a draft. An answer can wait; the entry is not published without one. */
export async function saveFaq(previous: FaqFormState, form: FormData): Promise<FaqFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const read = readFaqForm(form);
  if (!read.ok) return { status: 'invalid', errors: read.errors, attempt };
  try {
    const context = await adminClient();
    if (!context) return { status: 'signed-out', attempt };
    if (read.id) {
      const { data, error } = await context.supabase
        .from('faqs')
        .update({ question: read.question, answer: read.answer, visible: read.visible })
        .eq('id', read.id)
        .eq('pending_removal', false)
        .select('id');
      if (error) throw error;
      if (!data.length) return { status: 'missing', attempt };
    } else {
      const { data: last, error: lastError } = await context.supabase.from('faqs').select('position').order('position', { ascending: false }).limit(1);
      if (lastError) throw lastError;
      const { error } = await context.supabase
        .from('faqs')
        .insert({ question: read.question, answer: read.answer, visible: read.visible, position: (last[0]?.position ?? 0) + 1 });
      if (error) throw error;
    }
    refresh();
    return { status: 'saved', attempt, isNew: !read.id, question: read.question };
  } catch (error) {
    if (errorCode(error) === '42501') return { status: 'signed-out', attempt };
    logFailure('saveFaq', error);
    return { status: 'error', attempt };
  }
}

/** Moves a question one place up or down the draft list. */
export async function moveFaq(id: string, direction: 'up' | 'down'): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id) || (direction !== 'up' && direction !== 'down')) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    // The order as it stands now, not as the page last saw it, so two admins moving questions cannot scramble the list.
    const { data, error } = await context.supabase.from('faqs').select('id').order('position').order('created_at').order('id');
    if (error) throw error;
    const ids = data.map((row) => row.id);
    const at = ids.indexOf(id);
    if (at < 0) return { ok: false, reason: 'missing' };
    const to = direction === 'up' ? at - 1 : at + 1;
    if (to < 0 || to >= ids.length) return { ok: true };
    [ids[at], ids[to]] = [ids[to], ids[at]];
    const { error: reorderError } = await context.supabase.rpc('reorder_faqs', { p_ids: ids });
    if (reorderError) throw reorderError;
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('moveFaq', error);
    return { ok: false, reason: 'error' };
  }
}

/** Whether a question should be on the storefront once published. */
export async function setFaqVisible(id: string, visible: boolean): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id) || typeof visible !== 'boolean') return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('faqs').update({ visible }).eq('id', id).eq('pending_removal', false).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('setFaqVisible', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Removes a question. One that is live stays live until Publish, marked for removal; one that never went live is a
 * draft and goes now.
 */
export async function removeFaq(id: string): Promise<{ ok: true; staged: boolean } | { ok: false; reason: 'signed-out' | 'missing' | 'error' }> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data: live, error: liveError } = await context.supabase.from('live_faqs').select('faq_id').eq('faq_id', id).maybeSingle();
    if (liveError) throw liveError;
    const { data, error } = live
      ? await context.supabase.from('faqs').update({ pending_removal: true }).eq('id', id).select('id')
      : await context.supabase.from('faqs').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true, staged: Boolean(live) };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('removeFaq', error);
    return { ok: false, reason: 'error' };
  }
}

/** Takes back a staged removal: the question stays. */
export async function keepFaq(id: string): Promise<QuickResult> {
  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, reason: 'error' };
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.from('faqs').update({ pending_removal: false }).eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return { ok: false, reason: 'missing' };
    refresh();
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('keepFaq', error);
    return { ok: false, reason: 'error' };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------------------------------------------

export type PublishResult = { ok: true; copy: number; faqs: number } | { ok: false; reason: 'incomplete' | Problem };

/**
 * Publishes every saved draft, page copy and FAQs together, in one database transaction: visitors see the old site or
 * the new one, never a mix. Then the storefront's cached content is thrown away so the next visit reads the new one.
 */
export async function publishSite(): Promise<PublishResult> {
  try {
    const context = await adminClient();
    if (!context) return { ok: false, reason: 'signed-out' };
    const { data, error } = await context.supabase.rpc('publish_site');
    if (error) {
      if (errorCode(error) === '23514') return { ok: false, reason: 'incomplete' };
      throw error;
    }
    updateTag(STOREFRONT_CONTENT_TAG);
    refresh();
    return { ok: true, copy: data?.copy_changes ?? 0, faqs: data?.faq_changes ?? 0 };
  } catch (error) {
    if (errorCode(error) === '42501') return { ok: false, reason: 'signed-out' };
    logFailure('publishSite', error);
    return { ok: false, reason: 'error' };
  }
}
