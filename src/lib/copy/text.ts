/**
 * Reading storefront text. Kept apart from the slot list in ./index.ts so client components can use it without
 * shipping site-copy.json: they receive only the slots they render, picked on the server.
 */

/** Storefront text by slot key. Every fixed heading, label and message on the storefront comes from here. */
export type Copy = Readonly<Record<string, string>>;

/** Reads one slot. A key that is missing is a programming error, so it fails loudly outside production. */
export function t(copy: Copy, key: string, values?: Record<string, string | number>): string {
  const text = copy[key];
  if (text === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Copy key "${key}" is missing. Add it to design-system/site-copy.json, or to the keys picked for this component.`);
    }
    return '';
  }
  return values ? fill(text, values) : text;
}

/** Replaces {name}-style placeholders. Unknown placeholders are left as they are. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/** The slots whose keys start with one of the prefixes ("catalog." takes every catalog slot), for handing to a client component. */
export function pick(copy: Copy, prefixes: readonly string[]): Copy {
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(copy)) if (prefixes.some((prefix) => key.startsWith(prefix))) out[key] = text;
  return out;
}

/** "1 product shown." or "3 products shown.": the `.one` slot for exactly one, the `.other` slot with {count} otherwise. */
export function plural(copy: Copy, key: string, count: number): string {
  return count === 1 ? t(copy, `${key}.one`, { count }) : t(copy, `${key}.other`, { count });
}
