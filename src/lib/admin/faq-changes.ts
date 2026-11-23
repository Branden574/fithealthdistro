import type { FaqRow } from './content';

/** Limits on an FAQ entry, the same as the database's. */
export const FAQ_LIMITS = { question: 160, answer: 2000 } as const;

export interface FaqSummary {
  /** Entries already live that now sit in a different place in the list. */
  moved: Set<string>;
  /** Live entries whose draft has lost its question or answer: Publish refuses until they are filled in or restored. */
  blocking: Set<string>;
  /** How many changes Publish would make to the FAQ. */
  pending: number;
  /** New entries without both a question and an answer. Publish leaves them as drafts. */
  unfinished: number;
}

export const isComplete = (row: Pick<FaqRow, 'question' | 'answer'>) => row.question.trim() !== '' && row.answer.trim() !== '';

/** Rows arrive in draft order. Compares it with the live order and counts what publishing would change. */
export function summarizeFaqs(rows: readonly FaqRow[]): FaqSummary {
  const staying = rows.filter((row) => row.isPublished && !row.pendingRemoval);
  const live = [...staying].sort((a, b) => (a.publishedPosition ?? 0) - (b.publishedPosition ?? 0));
  const moved = new Set(staying.filter((row, index) => live[index]?.id !== row.id).map((row) => row.id));
  const blocking = new Set(staying.filter((row) => !isComplete(row)).map((row) => row.id));
  let pending = 0;
  let unfinished = 0;
  for (const row of rows) {
    if (row.isPublished && row.pendingRemoval) pending++;
    else if (!row.isPublished && !row.pendingRemoval) {
      if (isComplete(row)) pending++;
      else unfinished++;
    } else if (row.status === 'changed' || moved.has(row.id)) pending++;
  }
  return { moved, blocking, pending, unfinished };
}
