/** Client forms in the admin: correcting details, and recording activity and orders. Shared by the dialogs and the actions. */

export const CLIENT_LIMITS = { name: 120, company: 120, phone: 40, note: 280 } as const;

/** An order's total in dollars: more than nothing, at most ten million. The database checks the same. */
export const ORDER_LIMITS = { max: 10_000_000 } as const;

/** What an admin records on a client's page: something they did (a call, a visit), or an order with its total. */
export type RecordedKind = 'manual' | 'order';

export interface ClientFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'missing' | 'error';
  errors?: { name?: string; company?: string; phone?: string; day?: string; amount?: string; note?: string };
  attempt: number;
}

export const INITIAL_CLIENT_STATE: ClientFormState = { status: 'idle', attempt: 0 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^[0-9+().\-\s]*$/;
const CONTROL = new RegExp(`[${String.fromCodePoint(0)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`, 'g');

function line(form: FormData, name: string, limit: number): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.slice(0, limit * 4 + 8).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim() : '';
}

export function readClientForm(form: FormData) {
  const rawId = form.get('id');
  const id = typeof rawId === 'string' && UUID.test(rawId) ? rawId : '';
  const name = line(form, 'name', CLIENT_LIMITS.name);
  const company = line(form, 'company', CLIENT_LIMITS.company);
  const phone = line(form, 'phone', CLIENT_LIMITS.phone);
  const errors: NonNullable<ClientFormState['errors']> = {};
  if (!name) errors.name = 'Give the client a name.';
  else if (name.length > CLIENT_LIMITS.name) errors.name = `Keep the name to ${CLIENT_LIMITS.name} characters.`;
  if (company.length > CLIENT_LIMITS.company) errors.company = `Keep the company to ${CLIENT_LIMITS.company} characters.`;
  if (phone.length > CLIENT_LIMITS.phone) errors.phone = `Keep the phone number to ${CLIENT_LIMITS.phone} characters.`;
  else if (!PHONE.test(phone)) errors.phone = 'Use digits, spaces, and + ( ) - only.';
  if (!id) errors.name ??= 'Close this form and open it again.';
  return { id, name, company, phone, errors, ok: !errors.name && !errors.company && !errors.phone };
}

/** Whole dollars with or without thousands commas ("1,250" or "1250"), then up to two decimal places. */
const DOLLARS = /^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/;

/**
 * "1,250", "$1250.5" or "1250.50" as a number of dollars. Null for anything else, so a typo is caught rather than
 * rounded away: more than two decimal places, or a comma anywhere but between groups of three ("12,50" is not 1250).
 */
export function parseDollars(raw: string): number | null {
  const typed = raw.replace(/\s/g, '').replace(/^\$/, '');
  if (!DOLLARS.test(typed)) return null;
  const value = Number(typed.replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

/** Reads the record-activity and record-order forms. `today` is the admin's calendar day, which the day may not pass. */
export function readActivityForm(form: FormData, today: string) {
  const rawId = form.get('client_id');
  const clientId = typeof rawId === 'string' && UUID.test(rawId) ? rawId : '';
  const kind: RecordedKind = form.get('kind') === 'order' ? 'order' : 'manual';
  const rawDay = form.get('day');
  const day = typeof rawDay === 'string' ? rawDay.trim() : '';
  const note = line(form, 'note', CLIENT_LIMITS.note);
  const rawAmount = form.get('amount');
  const amount = kind === 'order' && typeof rawAmount === 'string' ? parseDollars(rawAmount) : null;
  const errors: NonNullable<ClientFormState['errors']> = {};
  const real = DAY.test(day) && !Number.isNaN(Date.parse(`${day}T12:00:00Z`)) && new Date(`${day}T12:00:00Z`).toISOString().startsWith(day);
  if (!real) errors.day = 'Pick the day it happened.';
  else if (day > today) errors.day = 'Pick today or a day before.';
  else if (day < '2000-01-01') errors.day = 'Pick a day from 2000 on.';
  if (kind === 'order') {
    const typed = typeof rawAmount === 'string' ? rawAmount.trim() : '';
    if (!typed) errors.amount = 'Enter the order total.';
    else if (amount === null) errors.amount = 'Enter the total in dollars, such as 1250 or 1250.50.';
    else if (amount <= 0) errors.amount = 'Enter a total above $0.';
    else if (amount > ORDER_LIMITS.max) errors.amount = 'Enter a total of $10,000,000 or less.';
  }
  if (note.length > CLIENT_LIMITS.note) errors.note = `Keep the note to ${CLIENT_LIMITS.note} characters.`;
  if (!clientId) errors.day ??= 'Close this form and open it again.';
  return { clientId, kind, day, amount, note, errors, ok: !errors.day && !errors.amount && !errors.note };
}
