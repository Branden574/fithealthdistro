'use client';

import type { MouseEvent } from 'react';
import { CATALOG_ID } from './links';

/**
 * The catalog's category filter, kept in the address (?category=drinks) so a filtered catalog can be shared and reloaded.
 * The page itself is static: the server always renders every product, and the filter applies once the page runs.
 */
const PARAM = 'category';

export interface CategoryFilter {
  /** The category slug, or '' for all products. May name a category that no longer exists; the catalog treats that as all. */
  slug: string;
  /** How many times the filter has changed since the page loaded. 0 means the visitor has not filtered yet. */
  changes: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();
const SERVER: CategoryFilter = Object.freeze({ slug: '', changes: 0 });
let current: CategoryFilter | null = null;

function fromAddress(): string {
  return new URLSearchParams(window.location.search).get(PARAM) ?? '';
}

function snapshot(): CategoryFilter {
  current ??= { slug: fromAddress(), changes: 0 };
  return current;
}

function set(slug: string) {
  const now = snapshot();
  if (now.slug === slug) return;
  current = { slug, changes: now.changes + 1 };
  listeners.forEach((listener) => listener());
}

// Back and Forward move between filters that were reached through a category link.
function onPopState() {
  set(fromAddress());
}

export const categoryFilter = {
  subscribe(listener: Listener) {
    if (!listeners.size) window.addEventListener('popstate', onPopState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (!listeners.size) window.removeEventListener('popstate', onPopState);
    };
  },
  getSnapshot: snapshot,
  getServerSnapshot: (): CategoryFilter => SERVER,
};

function addressFor(slug: string, hash: string): string {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(PARAM, slug);
  else url.searchParams.delete(PARAM);
  url.hash = hash;
  return url.href;
}

/** A filter chip: filters in place and updates the address without adding a step to Back. */
export function chooseCategory(slug: string) {
  window.history.replaceState(null, '', addressFor(slug, window.location.hash.slice(1)));
  set(slug);
}

/** A click that would open a new tab or window, which a link should be left to do. */
export function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * A category link (the nav bar, the hero's index). On a page with the catalog it filters the catalog, brings it into view
 * and moves focus there, as one step in history. Returns false where there is no catalog, so the link navigates as usual.
 */
export function showCategory(slug: string): boolean {
  const catalog = document.getElementById(CATALOG_ID);
  if (!catalog) return false;
  const next = addressFor(slug, CATALOG_ID);
  if (next === window.location.href) window.history.replaceState(null, '', next);
  else window.history.pushState(null, '', next);
  set(slug);
  // The page's scroll-behavior decides whether this glides; it is instant under reduced motion.
  catalog.scrollIntoView({ block: 'start' });
  catalog.focus({ preventScroll: true });
  return true;
}
