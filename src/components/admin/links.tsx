'use client';

import { Button } from '@ds';
import { useRouter } from 'next/navigation';
import { useCallback, type MouseEvent } from 'react';

/**
 * For a block of admin content whose links are plain anchors (inside design-system cards and tables): a click handler
 * that moves to admin pages without a full reload. A new-tab click, a mail link or another site is left to the browser.
 */
export function useAdminLinks() {
  const router = useRouter();
  return useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('download')) return;
      const href = link.getAttribute('href') ?? '';
      if (!/^\/admin(\/|\?|$)/.test(href)) return;
      event.preventDefault();
      router.push(href);
    },
    [router],
  );
}

interface PagerProps {
  page: number;
  perPage: number;
  total: number;
  /** The address of a page of the list. */
  hrefFor: (page: number) => string;
  /** What the list holds, plural: "inquiries". */
  noun: string;
}

/** "21 to 40 of 45", with the pages before and after. Hidden when everything fits on one page. */
export function Pager({ page, perPage, total, hrefFor, noun }: PagerProps) {
  const last = Math.max(1, Math.ceil(total / perPage));
  if (total <= perPage && page === 1) return null;
  const first = Math.min(total, (page - 1) * perPage + 1);
  const end = Math.min(total, page * perPage);
  return (
    <nav className="admin-pager" aria-label={`Pages of ${noun}`}>
      <p className="admin-muted" aria-live="polite">
        {total ? `${first} to ${end} of ${total} ${noun}` : `No ${noun} on this page`}
      </p>
      <div className="row admin-pager__buttons">
        {page > 1 ? (
          <Button size="sm" iconLeft="caret-left" href={hrefFor(Math.min(page - 1, last))}>
            Previous
          </Button>
        ) : (
          <Button size="sm" iconLeft="caret-left" disabled>
            Previous
          </Button>
        )}
        {page < last ? (
          <Button size="sm" iconRight="caret-right" href={hrefFor(page + 1)}>
            Next
          </Button>
        ) : (
          <Button size="sm" iconRight="caret-right" disabled>
            Next
          </Button>
        )}
      </div>
    </nav>
  );
}
