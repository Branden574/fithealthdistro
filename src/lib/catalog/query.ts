'use client';

/**
 * The catalog search, kept in the address (?q=) like the category, so a search can be shared and survives a reload.
 * The server renders every product with an empty box; the search from the address applies once the page runs.
 */
const PARAM = 'q';
export const QUERY_MAX = 80;

type Listener = () => void;
const listeners = new Set<Listener>();
let current: string | null = null;

const fromAddress = () => (new URLSearchParams(window.location.search).get(PARAM) ?? '').slice(0, QUERY_MAX);

function snapshot(): string {
  current ??= fromAddress();
  return current;
}

// Back and Forward bring back the search that entry had.
function onPopState() {
  const next = fromAddress();
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export const catalogQuery = {
  subscribe(listener: Listener) {
    if (!listeners.size) window.addEventListener('popstate', onPopState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size) return;
      window.removeEventListener('popstate', onPopState);
      // With no catalog on the page, forget the search, so the next catalog reads its own address.
      current = null;
    };
  },
  getSnapshot: snapshot,
  getServerSnapshot: () => '',
};

/** What the visitor typed, as typed. The address gets it trimmed, without adding a step to Back. */
export function setCatalogQuery(value: string) {
  const next = value.slice(0, QUERY_MAX);
  if (next === snapshot()) return;
  current = next;
  const url = new URL(window.location.href);
  const kept = next.trim();
  if (kept) url.searchParams.set(PARAM, kept);
  else url.searchParams.delete(PARAM);
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
  listeners.forEach((listener) => listener());
}
