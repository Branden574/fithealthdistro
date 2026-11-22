/**
 * The contact form's contract, shared by the form (client) and the action that receives it (server).
 * Limits match the inquiries table, so anything that passes here also passes the database's own checks.
 */

/** Every part of the form that can carry an error, in the order the form shows them. */
export const CONTACT_FIELDS = ['name', 'company', 'email', 'phone', 'interest', 'message', 'terms'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** The typed fields and their limits. */
export const TEXT_FIELDS = ['name', 'company', 'email', 'phone', 'message'] as const;
export type TextField = (typeof TEXT_FIELDS)[number];
export const CONTACT_LIMITS: Readonly<Record<TextField, number>> = {
  name: 120,
  company: 120,
  email: 254,
  phone: 40,
  message: 2000,
};

/** `required` and `invalid` read the field's own message; `long` reads contact.error.long with the limit. */
export type ContactError = 'required' | 'invalid' | 'long';
export type ContactErrors = Partial<Record<ContactField, ContactError>>;

/** What was sent, so a page rendered without the script can put it back. */
export interface ContactValues extends Partial<Record<TextField, string>> {
  interests?: string[];
  productIds?: string[];
  terms?: boolean;
  marketing?: boolean;
}

export interface ContactState {
  status: 'idle' | 'invalid' | 'rate_limited' | 'error' | 'sent';
  /** Counts submissions, so a second failure in a row is announced again. */
  attempt: number;
  errors?: ContactErrors;
  values?: ContactValues;
}

export const INITIAL_CONTACT_STATE: ContactState = { status: 'idle', attempt: 0 };

/**
 * The honeypot. People never see it; a form that arrives with it filled is dropped quietly. Named so that no browser or
 * password manager recognises it as a field to autofill (a "website" field can be filled for a real visitor).
 */
export const TRAP_FIELD = 'fhd_hp';
export const MAX_PRODUCTS = 50;
const MAX_INTERESTS = 20;

/**
 * Anything longer than this many times a field's limit is not read past. It is already too long, and no pattern ever runs
 * over unbounded input: the action can be posted directly with up to the request size limit.
 */
const RAW_FACTOR = 4;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Only ever run on an address of at most CONTACT_LIMITS.email characters.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with the usual separators, an optional leading +, and an optional extension ("x 204", "ext. 204").
// Only ever run on a number of at most CONTACT_LIMITS.phone characters.
const PHONE = /^\+?[0-9 ().-]+(?:\s*(?:x|ext\.?)\s*[0-9]{1,6})?$/i;
// Zero-width space, joiners, word joiner and byte-order mark, built from code points so the source stays plain ASCII.
const INVISIBLE = new RegExp(`[\\s${String.fromCodePoint(0x200b)}-${String.fromCodePoint(0x200d)}${String.fromCodePoint(0x2060, 0xfeff)}]`, 'g');

export interface ContactInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  /** Category slugs ticked under "I am interested in". */
  interests: string[];
  productIds: string[];
  terms: boolean;
  marketing: boolean;
  submissionId?: string;
  trap: string;
  /** Typed fields that arrived far past their limit and were cut short before reading. */
  oversize: TextField[];
}

/** One line: control characters and runs of spaces become one space. */
function line(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A paragraph or several: line breaks kept, other control characters dropped. */
function paragraphs(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '')
    .trim();
}

export function readContactForm(form: FormData): ContactInput {
  const oversize: TextField[] = [];
  const raw = (key: string, max: number): string => {
    const value = form.get(key);
    return typeof value === 'string' ? value.slice(0, max).normalize('NFC') : '';
  };
  const field = (key: TextField): string => {
    const max = CONTACT_LIMITS[key] * RAW_FACTOR;
    const value = form.get(key);
    if (typeof value === 'string' && value.length > max) oversize.push(key);
    return raw(key, max);
  };
  const many = (key: string, limit: number, valid: (value: string) => boolean): string[] => {
    const out = new Set<string>();
    for (const value of form.getAll(key)) {
      if (typeof value === 'string' && value.length <= 80 && valid(value)) out.add(value.toLowerCase());
      if (out.size >= limit) break;
    }
    return [...out];
  };
  const submissionId = raw('submission_id', 36);

  return {
    name: line(field('name')),
    company: line(field('company')),
    // Spaces, invisible characters and capitals never belong in an address.
    email: field('email').replace(INVISIBLE, '').toLowerCase(),
    phone: line(field('phone')),
    message: paragraphs(field('message')),
    interests: many('interest', MAX_INTERESTS, (value) => SLUG.test(value)),
    productIds: many('product_ids', MAX_PRODUCTS, (value) => value.length === 36 && UUID.test(value)),
    terms: raw('terms', 10) === 'yes',
    marketing: raw('marketing', 10) === 'yes',
    submissionId: UUID.test(submissionId) ? submissionId.toLowerCase() : undefined,
    trap: raw(TRAP_FIELD, 200).trim(),
    oversize,
  };
}

/**
 * Field errors, empty when the form can be sent. `interests` is what the visitor is asking about once the server has
 * resolved it: the ticked categories that exist, plus the categories of the products they picked.
 */
export function validateContact(input: ContactInput, interests: readonly string[]): ContactErrors {
  const errors: ContactErrors = {};
  const tooLong = (key: TextField) => input.oversize.includes(key) || input[key].length > CONTACT_LIMITS[key];

  if (!input.name) errors.name = 'required';
  else if (tooLong('name')) errors.name = 'long';

  if (tooLong('company')) errors.company = 'long';

  // Length first, so the shape check only ever sees a short string.
  if (tooLong('email')) errors.email = 'long';
  else if (!input.email || !EMAIL.test(input.email)) errors.email = 'invalid';

  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '').length;
    if (tooLong('phone')) errors.phone = 'long';
    else if (!PHONE.test(input.phone) || digits < 7 || digits > 20) errors.phone = 'invalid';
  }

  if (!interests.length) errors.interest = 'required';
  if (tooLong('message')) errors.message = 'long';
  if (!input.terms) errors.terms = 'required';
  return errors;
}
