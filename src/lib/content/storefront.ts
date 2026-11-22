import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { ORIGINAL_COPY, type Copy } from '@/lib/copy';
import { createPublicClient } from '@/lib/supabase/public';

/** Cache tag for published copy and FAQs. Publishing expires it. */
export const STOREFRONT_CONTENT_TAG = 'storefront-content';

export interface StorefrontFaq {
  id: string;
  question: string;
  answer: string;
}

export interface StorefrontContent {
  copy: Copy;
  faqs: StorefrontFaq[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks the shape of a content payload and lays the copy over the original wording, so a slot never renders empty. */
export function toStorefrontContent(raw: unknown): StorefrontContent {
  if (!isRecord(raw) || !isRecord(raw.copy) || !Array.isArray(raw.faqs)) throw new Error('Content payload has the wrong shape.');
  const copy: Record<string, string> = { ...ORIGINAL_COPY };
  for (const [key, text] of Object.entries(raw.copy)) if (typeof text === 'string') copy[key] = text;
  const faqs: StorefrontFaq[] = [];
  for (const item of raw.faqs) {
    if (isRecord(item) && typeof item.id === 'string' && typeof item.question === 'string' && typeof item.answer === 'string') {
      faqs.push({ id: item.id, question: item.question, answer: item.answer });
    }
  }
  return { copy: Object.freeze(copy), faqs };
}

/**
 * What visitors see: the published copy and the published, visible FAQ, read in one statement so the two always come
 * from the same publish. Cached until the next publish expires the tag.
 */
export async function getStorefrontContent(): Promise<StorefrontContent> {
  'use cache';
  cacheTag(STOREFRONT_CONTENT_TAG);
  cacheLife('max');
  const { data, error } = await createPublicClient().rpc('get_storefront_content');
  if (error) throw new Error(`Could not load the storefront content: ${error.message}`);
  return toStorefrontContent(data);
}

export async function getPublishedCopy(): Promise<Copy> {
  return (await getStorefrontContent()).copy;
}
