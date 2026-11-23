/** The catalog search, shared by the server (which prepares each product's text) and the browser (which matches it). */

/** Text as the search compares it: lower case, accents dropped, anything but letters, digits and dots read as a space. */
export function searchable(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .trim();
}

/** The words of a query, ready to match. Empty when nothing searchable was typed. */
export function queryWords(query: string): string[] {
  return searchable(query).split(' ').filter(Boolean);
}

/** True when every word appears somewhere in the product's text, in any order and inside longer words ("drink" finds "drinks"). */
export function matchesAll(text: string, words: readonly string[]): boolean {
  return words.every((word) => text.includes(word));
}
