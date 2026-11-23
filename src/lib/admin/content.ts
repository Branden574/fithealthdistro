import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { formatWhen } from './format';
import { adminTimeZone } from './time';

/** One storefront text slot as the editor shows it: the saved draft beside what visitors see and the original. */
export interface CopySlotRow {
  key: string;
  page: string;
  section: string;
  label: string;
  hint: string;
  original: string;
  max: number;
  multiline: boolean;
  optional: boolean;
  /** The saved draft. */
  draft: string;
  /** What visitors see now. */
  published: string;
}

export type FaqStatus = 'draft' | 'published' | 'changed' | 'removal';

/** One FAQ entry as the editor shows it: the next version beside the published one. */
export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
  pendingRemoval: boolean;
  /** Seeded examples: questions only, never approved. */
  isStarter: boolean;
  originalQuestion: string | null;
  originalAnswer: string | null;
  isPublished: boolean;
  publishedQuestion: string | null;
  publishedAnswer: string | null;
  publishedVisible: boolean | null;
  /** Its place in the published list, 1 first. */
  publishedPosition: number | null;
  status: FaqStatus;
}

export interface LastPublish {
  when: string;
  by: string;
}

/** Everything the Site content page shows. Call `requireAdmin` first. */
export async function getSiteContent(): Promise<{ slots: CopySlotRow[]; faqs: FaqRow[]; lastPublish: LastPublish | null }> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const [slots, faqs, publications] = await Promise.all([
    supabase
      .from('site_content_editor')
      .select('key, page, section, label, hint, original, max_length, multiline, optional, draft, published, sort_order')
      .order('sort_order'),
    supabase
      .from('faq_editor')
      .select(
        'id, question, answer, position, visible, pending_removal, is_starter, original_question, original_answer, is_published, published_question, published_answer, published_visible, published_position, status, created_at',
      )
      .order('position')
      .order('created_at')
      .order('id'),
    supabase.from('publications').select('published_at, published_by').order('id', { ascending: false }).limit(1),
  ]);
  for (const result of [slots, faqs, publications]) if (result.error) throw new Error(`Could not read the site content: ${result.error.message}`);

  let lastPublish: LastPublish | null = null;
  const last = publications.data?.[0];
  if (last) {
    const { data: admin } = last.published_by
      ? await supabase.from('admins').select('name, email').eq('user_id', last.published_by).maybeSingle()
      : { data: null };
    lastPublish = { when: formatWhen(last.published_at, zone, now), by: admin ? admin.name.trim() || admin.email : 'a former admin' };
  }

  return {
    lastPublish,
    slots: (slots.data ?? []).map((row) => ({
      key: row.key ?? '',
      page: row.page ?? '',
      section: row.section ?? '',
      label: row.label ?? '',
      hint: row.hint ?? '',
      original: row.original ?? '',
      max: row.max_length ?? 0,
      multiline: row.multiline ?? false,
      optional: row.optional ?? false,
      draft: row.draft ?? '',
      published: row.published ?? '',
    })),
    faqs: (faqs.data ?? []).map((row) => ({
      id: row.id ?? '',
      question: row.question ?? '',
      answer: row.answer ?? '',
      visible: row.visible ?? true,
      pendingRemoval: row.pending_removal ?? false,
      isStarter: row.is_starter ?? false,
      originalQuestion: row.original_question,
      originalAnswer: row.original_answer,
      isPublished: row.is_published ?? false,
      publishedQuestion: row.published_question,
      publishedAnswer: row.published_answer,
      publishedVisible: row.published_visible,
      publishedPosition: row.published_position,
      status: (row.status ?? 'draft') as FaqStatus,
    })),
  };
}
