import siteCopy from '@ds/site-copy.json';
import type { Copy } from './text';

export { fill, pick, plural, t, type Copy } from './text';

export interface CopySlot {
  key: string;
  page: string;
  section: string;
  label: string;
  text: string;
  max: number;
  hint?: string;
  multiline?: boolean;
  /** The slot may be published empty (the hero highlight). */
  optional?: boolean;
}

/** The slots the site ships with, from design-system/site-copy.json. Restore original puts these back. */
export const COPY_SLOTS: readonly CopySlot[] = siteCopy.slots as CopySlot[];

/** The original wording of every slot. A slot with no published text yet falls back to this. */
export const ORIGINAL_COPY: Copy = Object.freeze(Object.fromEntries(COPY_SLOTS.map((slot) => [slot.key, slot.text])));
