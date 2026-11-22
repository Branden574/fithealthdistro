'use client';

import { useSyncExternalStore } from 'react';
import { RequestList, type RequestListItem } from '@ds';
import { announce } from '@/lib/a11y/announce';
import type { CatalogCategory, CatalogProduct } from '@/lib/catalog';
import { plural, t, type Copy } from '@/lib/copy/text';
import { requestStore } from '@/lib/request/store';

interface RequestSummaryProps {
  /** The request.* slots and catalog.card.removed.announce. */
  copy: Copy;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

/** The running request beside the contact form. Products no longer in the catalog drop out of it. */
export function RequestSummary({ copy, categories, products }: RequestSummaryProps) {
  const picked = useSyncExternalStore(requestStore.subscribe, requestStore.getSnapshot, requestStore.getServerSnapshot);
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const items: RequestListItem[] = [];
  for (const id of picked) {
    const product = productById.get(id);
    if (!product) continue;
    const category = categoryById.get(product.categoryId);
    items.push({ id, name: product.name, category: category?.name, icon: category?.icon });
  }

  function remove(id: string) {
    const name = productById.get(id)?.name ?? '';
    requestStore.remove(id);
    announce(t(copy, 'catalog.card.removed.announce', { name }));
  }

  return (
    <RequestList
      className="contact__request"
      title={t(copy, 'request.title')}
      summary={plural(copy, 'request.count', items.length)}
      items={items}
      empty={t(copy, 'request.empty')}
      removeLabel={t(copy, 'request.remove')}
      removeAriaLabel={(item) => t(copy, 'request.remove.label', { name: item.name })}
      onRemove={remove}
    />
  );
}
