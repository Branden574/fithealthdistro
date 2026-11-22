'use client';

/**
 * The visitor's quote request: the product ids they pressed "I'm interested" on, kept in this browser only.
 * A tiny external store so the catalog, the running request and the contact form share one list, and other tabs follow.
 */
const KEY = 'fhd.request.v1';
const MAX = 50;
type Listener = () => void;
const listeners = new Set<Listener>();
let cache: readonly string[] | null = null;
const EMPTY: readonly string[] = Object.freeze([]);

function read(): readonly string[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Object.freeze(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX) : []);
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: readonly string[]) {
  cache = Object.freeze(next.slice(0, MAX));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Private browsing or storage full: the request still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

export const requestStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      // A null key means another tab cleared all of storage, this list included.
      if (event.key !== null && event.key !== KEY) return;
      cache = null;
      listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: (): readonly string[] => EMPTY,
  /** Adds a product. False when the request is already full, so the caller does not confirm something that did not happen. */
  add(id: string): boolean {
    const now = read();
    if (now.includes(id)) return true;
    if (now.length >= MAX) return false;
    write([...now, id]);
    return true;
  },
  /** Drops products that are no longer in the catalog, so they stop taking room in the request. */
  retain(ids: readonly string[]) {
    const keep = new Set(ids);
    const now = read();
    if (now.every((id) => keep.has(id))) return;
    write(now.filter((id) => keep.has(id)));
  },
  remove(id: string) {
    write(read().filter((x) => x !== id));
  },
  clear() {
    write([]);
  },
};
