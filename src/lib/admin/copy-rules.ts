/**
 * What a page-copy draft must be before it can be saved: within its limit, not empty unless the slot allows it, and
 * keeping every {placeholder} the site fills in. Shared by the editor, which shows the problem as Ryan types, and the
 * save action, which checks again on the server.
 */

export interface SlotRule {
  key: string;
  /** The wording the site shipped with. Its placeholders are the ones the site fills in. */
  original: string;
  max: number;
  multiline: boolean;
  optional: boolean;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** The {names} in a piece of copy. */
export function placeholdersIn(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((match) => match[1]))];
}

/** How a draft is stored: Windows line breaks made plain, no line breaks in a one-line slot, no spaces at either end. */
export function tidyDraft(text: string, multiline: boolean): string {
  const plain = text.replace(/\r\n?/g, '\n');
  return (multiline ? plain.replace(/[ \t]+$/gm, '') : plain.replace(/\s*\n\s*/g, ' ')).trim();
}

/** The slot keys that are checked against each other: the highlighted words must appear in the headline. */
export const HEADLINE_KEY = 'home.hero.headline';
export const HIGHLIGHT_KEY = 'home.hero.highlight';

/**
 * Why a draft cannot be saved, or null. `values` holds every slot's current text, for the one rule that spans two
 * slots. A draft that is too long is reported here too, though the editor's field also says so itself.
 */
export function slotProblem(rule: SlotRule, text: string, values: Readonly<Record<string, string>>): string | null {
  const tidy = tidyDraft(text, rule.multiline);
  if (tidy.length > rule.max) return `Keep this to ${rule.max} characters. It has ${tidy.length}.`;
  if (!rule.optional && !tidy) return 'Write something here. The site needs this text.';
  const needed = placeholdersIn(rule.original);
  const missing = needed.filter((name) => !tidy.includes(`{${name}}`));
  if (missing.length) return `Keep ${missing.map((name) => `{${name}}`).join(' and ')} in the text. The site fills ${missing.length === 1 ? 'it' : 'them'} in.`;
  const unknown = placeholdersIn(tidy).filter((name) => !needed.includes(name));
  if (unknown.length) {
    const allowed = needed.length ? ` Only ${needed.map((name) => `{${name}}`).join(' and ')} can be used here.` : '';
    return `The site cannot fill in ${unknown.map((name) => `{${name}}`).join(' or ')}.${allowed}`;
  }
  if (rule.key === HIGHLIGHT_KEY && tidy) {
    const headline = tidyDraft(values[HEADLINE_KEY] ?? '', false);
    if (!headline.includes(tidy)) return 'Use words from the headline, exactly as written there, or leave this empty.';
  }
  return null;
}
