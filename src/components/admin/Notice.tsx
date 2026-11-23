'use client';

import { Alert, Button } from '@ds';
import { usePathname } from 'next/navigation';
import { SIGN_IN_PATH } from '@/lib/admin/paths';

export interface Notice {
  /** Changes with every notice, so the same message twice still replays its entrance and is announced again. */
  id: number;
  tone: 'success' | 'danger' | 'info';
  title: string;
  body?: string;
  /** Offers to sign in again, back to this page. */
  signIn?: boolean;
  /** One button beside the message: "Undo", "Mark as replied". */
  action?: { label: string; run: () => void };
}

/** Why a quick change did not go through, worded for the admin. */
export function problemNotice(reason: 'signed-out' | 'missing' | 'error', thing: string): Omit<Notice, 'id'> {
  if (reason === 'signed-out') return { tone: 'danger', title: 'Your session ended', body: 'Sign in again to keep working. Nothing was changed.', signIn: true };
  if (reason === 'missing') return { tone: 'danger', title: `That ${thing} is gone`, body: `It was removed elsewhere. The list now shows what is left.` };
  return { tone: 'danger', title: 'That did not go through', body: 'Nothing was changed. Try again in a moment.' };
}

/** The confirmation or problem from the last change, above the page's content. */
export function NoticeBar({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  const pathname = usePathname();
  if (!notice) return null;
  const action = notice.signIn ? (
    <Button size="sm" variant="outline" href={`${SIGN_IN_PATH}?next=${encodeURIComponent(pathname)}`}>
      Sign in
    </Button>
  ) : notice.action ? (
    <Button size="sm" variant="outline" onClick={notice.action.run}>
      {notice.action.label}
    </Button>
  ) : undefined;
  return (
    <Alert key={notice.id} className="fhd-appear" tone={notice.tone} title={notice.title} onDismiss={onDismiss} dismissLabel="Dismiss" action={action}>
      {notice.body}
    </Alert>
  );
}

const LEFT = 'fhd_notice';
type LeftNotice = Pick<Notice, 'tone' | 'title' | 'body'>;

/** Leaves a notice for the next admin page to show: after a removal, which sends the admin back to the list. */
export function leaveNotice(notice: LeftNotice) {
  try {
    window.sessionStorage.setItem(LEFT, JSON.stringify(notice));
  } catch {
    // Without storage the admin simply lands on the list, which no longer shows what was removed.
  }
}

/** The notice the last page left, once. */
export function takeNotice(): LeftNotice | null {
  try {
    const raw = window.sessionStorage.getItem(LEFT);
    if (!raw) return null;
    window.sessionStorage.removeItem(LEFT);
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const { tone, title, body } = value as Record<string, unknown>;
    if ((tone !== 'success' && tone !== 'info') || typeof title !== 'string') return null;
    return { tone, title: title.slice(0, 200), body: typeof body === 'string' ? body.slice(0, 400) : undefined };
  } catch {
    return null;
  }
}
