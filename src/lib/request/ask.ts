'use client';

/**
 * "Ask about it": when the catalog search finds nothing, the visitor can carry what they typed into the quote form's
 * message. The catalog and the form are separate islands on the page, so they meet through one window event.
 */
const EVENT = 'fhd:ask-about';

/** Starts the quote form's message with `text` and takes the visitor to it. */
export function askAbout(text: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: text }));
}

/** For the quote form: called with the text whenever the catalog asks. Returns the unsubscribe. */
export function onAskAbout(handler: (text: string) => void): () => void {
  const listener = (event: Event) => {
    const text = (event as CustomEvent<unknown>).detail;
    if (typeof text === 'string' && text) handler(text);
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
