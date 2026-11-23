'use client';

import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { Button, Chip, EmptyState, Icon, ProductCard, TextField } from '@ds';
import { announce } from '@/lib/a11y/announce';
import type { CatalogCategory, CatalogProduct } from '@/lib/catalog';
import { categoryFilter, chooseCategory } from '@/lib/catalog/filter';
import { productHref } from '@/lib/catalog/links';
import { catalogQuery, QUERY_MAX, setCatalogQuery } from '@/lib/catalog/query';
import { matchesAll, queryWords } from '@/lib/catalog/search';
import { plural, t, type Copy } from '@/lib/copy/text';
import { askAbout } from '@/lib/request/ask';
import { requestStore } from '@/lib/request/store';

interface CatalogBrowserProps {
  /** The section's eyebrow and heading, rendered on the server. */
  heading: ReactNode;
  /** The catalog.* slots. */
  copy: Copy;
  categories: CatalogCategory[];
  products: CatalogProduct[];
  /** The site's root for product links: empty, or "/preview" in the admin's draft preview. */
  linkBase?: string;
}

/** How long typing has to pause before the number of results is read out. */
const ANNOUNCE_AFTER_MS = 700;

const subscribeToNothing = () => () => {};
const isScripted = () => true;
const isNotScripted = () => false;

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

/**
 * Search, filter chips and the product grid. Every product is in the server's HTML; searching, filtering and
 * "I'm interested" run here. A search that finds nothing offers to carry the words into the quote form.
 */
export function CatalogBrowser({ heading, copy, categories, products, linkBase = '' }: CatalogBrowserProps) {
  const filter = useSyncExternalStore(categoryFilter.subscribe, categoryFilter.getSnapshot, categoryFilter.getServerSnapshot);
  const picked = useSyncExternalStore(requestStore.subscribe, requestStore.getSnapshot, requestStore.getServerSnapshot);
  // The search needs the script, so the box stays disabled until it runs rather than taking typing it cannot use.
  const scripted = useSyncExternalStore(subscribeToNothing, isScripted, isNotScripted);
  const query = useSyncExternalStore(catalogQuery.subscribe, catalogQuery.getSnapshot, catalogQuery.getServerSnapshot);
  const typed = useRef(false);

  // Products that left the catalog since the visitor picked them stop counting toward the request's limit.
  useEffect(() => {
    requestStore.retain(products.map((product) => product.id));
  }, [products]);

  const words = queryWords(query);
  const searching = words.length > 0;
  const matching = searching ? products.filter((product) => matchesAll(product.search, words)) : products;
  const active = categories.find((category) => category.slug === filter.slug);
  const categoryOf = new Map(categories.map((category) => [category.id, category]));
  const countIn = (categoryId: string) => matching.filter((product) => product.categoryId === categoryId).length;
  const shown = active ? matching.filter((product) => product.categoryId === active.id) : matching;

  // Once typing pauses, say how many products are showing. Not on load, and not for a search picked up from the address.
  useEffect(() => {
    if (!typed.current) return;
    const timer = window.setTimeout(() => announce(plural(copy, 'catalog.results', shown.length)), ANNOUNCE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [copy, query, shown.length]);

  function search(next: string) {
    typed.current = true;
    setCatalogQuery(next);
  }

  function choose(category?: CatalogCategory) {
    // Compared with the address, so "All" also clears a category that no longer exists.
    if ((category?.slug ?? '') === filter.slug) return;
    chooseCategory(category?.slug ?? '');
    announce(plural(copy, 'catalog.results', category ? countIn(category.id) : matching.length));
  }

  function toggle(product: CatalogProduct) {
    if (picked.includes(product.id)) {
      requestStore.remove(product.id);
      announce(t(copy, 'catalog.card.removed.announce', { name: product.name }));
    } else if (requestStore.add(product.id)) {
      announce(t(copy, 'catalog.card.added.announce', { name: product.name }));
    }
  }

  const said = query.trim();
  let empty: ReactNode;
  if (shown.length) {
    empty = null;
  } else if (searching && active && matching.length) {
    // Nothing in this category, but the search finds something elsewhere.
    empty = (
      <EmptyState
        icon="magnifying-glass"
        title={t(copy, 'catalog.search.elsewhere.title', { category: active.name, query: said })}
        action={
          <Button variant="outline" onClick={() => choose()}>
            {t(copy, 'catalog.search.elsewhere.action')}
          </Button>
        }
      />
    );
  } else if (searching) {
    empty = (
      <EmptyState
        icon="magnifying-glass"
        title={t(copy, 'catalog.search.none.title', { query: said })}
        description={t(copy, 'catalog.search.none.body')}
        action={
          <div className="row">
            <Button variant="primary" iconRight="arrow-right" onClick={() => askAbout(t(copy, 'catalog.search.ask.message', { query: said }))}>
              {t(copy, 'catalog.search.none.action')}
            </Button>
            <Button variant="ghost" onClick={() => search('')}>
              {t(copy, 'catalog.search.clear')}
            </Button>
          </div>
        }
      />
    );
  } else {
    empty = <EmptyState icon="package" title={t(copy, 'catalog.empty.title')} description={t(copy, 'catalog.empty.body')} />;
  }

  return (
    <>
      <div className="section-head">
        {heading}
        <div className="catalog-tools">
          <div className="catalog-search" role="search">
            <TextField
              type="search"
              label={t(copy, 'catalog.search.label')}
              hideLabel
              placeholder={t(copy, 'catalog.search.placeholder')}
              prefix={<Icon name="magnifying-glass" size={20} />}
              suffix={
                query ? (
                  <button type="button" className="catalog-search__clear" aria-label={t(copy, 'catalog.search.clear')} onClick={() => search('')}>
                    <Icon name="x" size={16} />
                  </button>
                ) : null
              }
              value={query}
              onChange={(event) => search(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) search('');
              }}
              maxLength={QUERY_MAX}
              autoComplete="off"
              enterKeyHint="search"
              disabled={!scripted}
            />
          </div>
          {categories.length > 1 ? (
            <div className="row" role="group" aria-label={t(copy, 'catalog.filter.label')}>
              <Chip selected={!active} count={matching.length} onClick={() => choose()}>
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
      </div>

      {shown.length ? (
        // A new list for each filter, so the cards that arrive play their short entrance; none of it plays before the first
        // filter, and typing a search does not replay it.
        <ul key={active?.slug ?? ''} className={filter.changes > 0 ? 'catalog-grid fhd-appear-list' : 'catalog-grid'}>
          {shown.map((product, index) => {
            const category = categoryOf.get(product.categoryId);
            const unavailable = product.stock === 'out_of_stock';
            return (
              <li key={product.id} style={{ '--fhd-i': index } as CSSProperties}>
                <ProductCard
                  name={product.name}
                  href={productHref(product.slug, linkBase)}
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
        empty
      )}
    </>
  );
}
