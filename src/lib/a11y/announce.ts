'use client';

/**
 * One polite live region for the whole storefront, so the catalog, the request and the filters never talk over each other.
 * Render <LiveRegion /> once; call announce() from anywhere on the client.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let message = '';
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((listener) => listener());
}

export const announcer = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => message,
  getServerSnapshot: () => '',
};

/** Says a short sentence to screen readers. The region is cleared first, so the same sentence twice in a row is still read. */
export function announce(text: string) {
  clearTimeout(timer);
  message = '';
  emit();
  timer = setTimeout(() => {
    message = text;
    emit();
  }, 50);
}
