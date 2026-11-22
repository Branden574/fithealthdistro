'use client';

import { useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { Chip, EmptyState, ProductCard } from '@ds';
import { announce } from '@/lib/a11y/announce';
import type { CatalogCategory, CatalogProduct } from '@/lib/catalog';
import { categoryFilter, chooseCategory } from '@/lib/catalog/filter';
import { productHref } from '@/lib/catalog/links';
import { plural, t, type Copy } from '@/lib/copy/text';
import { requestStore } from '@/lib/request/store';

interface CatalogBrowserProps {
  /** The section's eyebrow and heading, rendered on the server. */
  heading: ReactNode;
  /** The catalog.* slots. */
  copy: Copy;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

/** What a card shows for its price: dollars when there is one, otherwise the note as written ("Call for price"). $0 is never shown. */
function priceOf(product: CatalogProduct): { price?: number | string; priceNote?: string } {
  if (product.price != null && product.price > 0) return { price: product.price, priceNote: product.priceNote || undefined };
  return { price: product.priceNote || undefined };
}

function badgesOf(copy: Copy, product: CatalogProduct) {
  const badges: Array<{ label: string; tone: 'danger' | 'warning' | 'neutral' }> = [];
  if (product.stock === 'out_of_stock') badges.push({ label: t(copy, 'catalog.stock.out'), tone: 'danger' });
  else if (product.stock === 'low_stock') badges.push({ label: t(copy, 'catalog.stock.low'), tone: 'warning' });
  if (product.isSample) badges.push({ label: t(copy, 'catalog.card.sample'), tone: 'neutral' });
  return badges;
}

/** Filter chips and the product grid. Every product is in the server's HTML; filtering and "I'm interested" run here. */
export function CatalogBrowser({ heading, copy, categories, products }: CatalogBrowserProps) {
  const filter = useSyncExternalStore(categoryFilter.subscribe, categoryFilter.getSnapshot, categoryFilter.getServerSnapshot);
  const picked = useSyncExternalStore(requestStore.subscribe, requestStore.getSnapshot, requestStore.getServerSnapshot);

  // Products that left the catalog since the visitor picked them stop counting toward the request's limit.
  useEffect(() => {
    requestStore.retain(products.map((product) => product.id));
  }, [products]);

  const active = categories.find((category) => category.slug === filter.slug);
  const categoryOf = new Map(categories.map((category) => [category.id, category]));
  const countIn = (categoryId: string) => products.filter((product) => product.categoryId === categoryId).length;
  const shown = active ? products.filter((product) => product.categoryId === active.id) : products;

  function choose(category?: CatalogCategory) {
    // Compared with the address, so "All" also clears a category that no longer exists.
    if ((category?.slug ?? '') === filter.slug) return;
    chooseCategory(category?.slug ?? '');
    announce(plural(copy, 'catalog.results', category ? countIn(category.id) : products.length));
  }

  function toggle(product: CatalogProduct) {
    if (picked.includes(product.id)) {
      requestStore.remove(product.id);
      announce(t(copy, 'catalog.card.removed.announce', { name: product.name }));
    } else if (requestStore.add(product.id)) {
      announce(t(copy, 'catalog.card.added.announce', { name: product.name }));
    }
  }

  return (
    <>
      <div className="section-head">
        {heading}
        {categories.length > 1 ? (
          <div className="row" role="group" aria-label={t(copy, 'catalog.filter.label')}>
            <Chip selected={!active} count={products.length} onClick={() => choose()}>
              {t(copy, 'catalog.filter.all')}
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={category.id === active?.id}
                icon={category.icon}
                count={countIn(category.id)}
                onClick={() => choose(category)}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      {shown.length ? (
        // A new list for each filter, so the cards that arrive play their short entrance; none of it plays before the first filter.
        <ul key={active?.slug ?? ''} className={filter.changes > 0 ? 'catalog-grid fhd-appear-list' : 'catalog-grid'}>
          {shown.map((product, index) => {
            const category = categoryOf.get(product.categoryId);
            const unavailable = product.stock === 'out_of_stock';
            return (
              <li key={product.id} style={{ '--fhd-i': index } as CSSProperties}>
                <ProductCard
                  name={product.name}
                  href={productHref(product.slug)}
                  category={category?.name}
                  icon={category?.icon}
                  description={product.description || undefined}
                  image={product.imageUrl ?? undefined}
                  {...priceOf(product)}
                  badges={badgesOf(copy, product)}
                  unavailable={unavailable}
                  selected={!unavailable && picked.includes(product.id)}
                  ctaLabel={t(copy, 'catalog.card.cta')}
                  selectedLabel={t(copy, 'catalog.card.added')}
                  unavailableLabel={t(copy, 'catalog.card.unavailable')}
                  onInterest={() => toggle(product)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="package" title={t(copy, 'catalog.empty.title')} description={t(copy, 'catalog.empty.body')} />
      )}
    </>
  );
}
