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
  return (
    <Alert
      key={notice.id}
      className="fhd-appear"
      tone={notice.tone}
      title={notice.title}
      onDismiss={onDismiss}
      dismissLabel="Dismiss"
      action={
        notice.signIn ? (
          <Button size="sm" variant="outline" href={`${SIGN_IN_PATH}?next=${encodeURIComponent(pathname)}`}>
            Sign in
          </Button>
        ) : undefined
      }
    >
      {notice.body}
    </Alert>
  );
}
