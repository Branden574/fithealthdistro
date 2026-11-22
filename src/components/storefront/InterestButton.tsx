'use client';

import { useSyncExternalStore } from 'react';
import { Button } from '@ds';
import { announce } from '@/lib/a11y/announce';
import { t, type Copy } from '@/lib/copy/text';
import { requestStore } from '@/lib/request/store';

interface InterestButtonProps {
  productId: string;
  name: string;
  unavailable: boolean;
  /** catalog.card.*, product.request.view and nav.cta. */
  copy: Copy;
}

/**
 * "I'm interested" on a product's own page, sharing the request with the catalog. Beside it, the way to the form; its
 * label changes once the product is in the request, and the two buttons never move.
 */
export function InterestButton({ productId, name, unavailable, copy }: InterestButtonProps) {
  const picked = useSyncExternalStore(requestStore.subscribe, requestStore.getSnapshot, requestStore.getServerSnapshot);
  const selected = !unavailable && picked.includes(productId);

  function toggle() {
    if (selected) {
      requestStore.remove(productId);
      announce(t(copy, 'catalog.card.removed.announce', { name }));
    } else if (requestStore.add(productId)) {
      announce(t(copy, 'catalog.card.added.announce', { name }));
    }
  }

  return (
    <div className="row product-page__actions">
      <Button
        variant={selected ? 'solid' : 'primary'}
        size="lg"
        iconLeft={selected ? 'check' : undefined}
        disabled={unavailable}
        aria-pressed={unavailable ? undefined : selected}
        onClick={toggle}
      >
        {unavailable ? t(copy, 'catalog.card.unavailable') : selected ? t(copy, 'catalog.card.added') : t(copy, 'catalog.card.cta')}
      </Button>
      <Button size="lg" href="/#contact" iconRight="arrow-right">
        {selected ? t(copy, 'product.request.view') : t(copy, 'nav.cta')}
      </Button>
    </div>
  );
}
