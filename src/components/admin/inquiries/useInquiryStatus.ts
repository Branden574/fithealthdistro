'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { problemNotice, type Notice } from '@/components/admin/Notice';
import type { AdminInquiry, InquiryStatus } from '@/lib/admin/inquiries';
import { setInquiryStatus } from '@/lib/admin/inquiry-actions';

export const STATUS_LABELS: Record<InquiryStatus, string> = { new: 'New', read: 'Read', replied: 'Replied' };

type Say = (notice: Omit<Notice, 'id'>) => void;

/**
 * Moving inquiries between New, Read and Replied, shared by the list and an inquiry's own page. Each card shows its new
 * state at once and waits while it saves; each change offers Undo. Reply opens a mail but changes nothing past Read:
 * the admin marks it replied once the mail has actually gone.
 */
export function useInquiryStatus<Row extends Pick<AdminInquiry, 'id' | 'name' | 'status'>>(rows: Row[], say: Say) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shown, show] = useOptimistic(rows, (current: Row[], change: { id: string; status: InquiryStatus }) =>
    current.map((row) => (row.id === change.id ? { ...row, status: change.status } : row)),
  );
  const [busy, wait] = useOptimistic<string[], string>([], (ids, id) => [...ids, id]);

  function move(inquiry: Row, to: InquiryStatus, from: InquiryStatus, undoing = false) {
    startTransition(async () => {
      wait(inquiry.id);
      show({ id: inquiry.id, status: to });
      const result = await setInquiryStatus(inquiry.id, to, from);
      if (!result.ok) {
        if (result.reason === 'changed') {
          say({
            tone: 'info',
            title: 'This inquiry moved',
            body: `Someone changed the inquiry from ${inquiry.name} since this page loaded. It now shows where it stands.`,
          });
        } else {
          say(problemNotice(result.reason, 'inquiry'));
        }
        if (result.reason === 'changed' || result.reason === 'missing') router.refresh();
        return;
      }
      if (undoing) {
        say({ tone: 'success', title: `Moved back to ${STATUS_LABELS[to]}`, body: `The inquiry from ${inquiry.name} is where it was.` });
        return;
      }
      say({
        tone: 'success',
        title: to === 'replied' ? 'Marked as replied' : to === 'read' ? 'Marked as read' : 'Marked as new',
        body: `The inquiry from ${inquiry.name} is under ${STATUS_LABELS[to]} now.`,
        action: { label: 'Undo', run: () => move(inquiry, from, to, true) },
      });
    });
  }

  /** Reply was pressed and the mail is opening. A new inquiry counts as read from here; it is not replied yet. */
  function replying(inquiry: Row) {
    if (inquiry.status === 'replied') return;
    const from = inquiry.status === 'new' ? 'read' : inquiry.status;
    say({
      tone: 'info',
      title: `Writing to ${inquiry.name}`,
      body: 'Once your mail has gone, mark the inquiry as replied.',
      action: { label: 'Mark as replied', run: () => move(inquiry, 'replied', from) },
    });
    if (inquiry.status !== 'new') return;
    startTransition(async () => {
      show({ id: inquiry.id, status: 'read' });
      const result = await setInquiryStatus(inquiry.id, 'read', 'new');
      // Already moved on elsewhere is fine: reading it never undoes that.
      if (!result.ok && result.reason !== 'changed') say(problemNotice(result.reason, 'inquiry'));
    });
  }

  return { shown, busy, move, replying };
}
