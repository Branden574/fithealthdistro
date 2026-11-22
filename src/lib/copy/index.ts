import siteCopy from '@ds/site-copy.json';

/** Storefront text by slot key. Every fixed heading, label and message on the storefront comes from here. */
export type Copy = Readonly<Record<string, string>>;

export interface CopySlot {
  key: string;
  page: string;
  section: string;
  label: string;
  text: string;
  max: number;
  hint?: string;
  multiline?: boolean;
}

/** The slots the site ships with, from design-system/site-copy.json. Restore original puts these back. */
export const COPY_SLOTS: readonly CopySlot[] = siteCopy.slots as CopySlot[];

/** The original wording of every slot. A slot with no published text yet falls back to this. */
export const ORIGINAL_COPY: Copy = Object.freeze(Object.fromEntries(COPY_SLOTS.map((slot) => [slot.key, slot.text])));

/** Reads one slot. A key that is not in site-copy.json is a programming error, so it fails loudly outside production. */
export function t(copy: Copy, key: string, values?: Record<string, string | number>): string {
  const text = copy[key];
  if (text === undefined) {
    if (process.env.NODE_ENV !== 'production') throw new Error(`Unknown copy key "${key}". Add it to design-system/site-copy.json.`);
    return '';
  }
  return values ? fill(text, values) : text;
}

/** Replaces {name}-style placeholders. Unknown placeholders are left as they are. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}
