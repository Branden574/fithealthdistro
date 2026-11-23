/** Client forms in the admin: correcting details, and recording activity. Shared by the dialogs and the actions. */

export const CLIENT_LIMITS = { name: 120, company: 120, phone: 40, note: 280 } as const;

export interface ClientFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'missing' | 'error';
  errors?: { name?: string; company?: string; phone?: string; day?: string; note?: string };
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

/** Reads the record-activity form. `today` is the admin's calendar day, which the day may not pass. */
export function readActivityForm(form: FormData, today: string) {
  const rawId = form.get('client_id');
  const clientId = typeof rawId === 'string' && UUID.test(rawId) ? rawId : '';
  const rawDay = form.get('day');
  const day = typeof rawDay === 'string' ? rawDay.trim() : '';
  const note = line(form, 'note', CLIENT_LIMITS.note);
  const errors: NonNullable<ClientFormState['errors']> = {};
  const real = DAY.test(day) && !Number.isNaN(Date.parse(`${day}T12:00:00Z`)) && new Date(`${day}T12:00:00Z`).toISOString().startsWith(day);
  if (!real) errors.day = 'Pick the day it happened.';
  else if (day > today) errors.day = 'Pick today or a day before.';
  else if (day < '2000-01-01') errors.day = 'Pick a day from 2000 on.';
  if (note.length > CLIENT_LIMITS.note) errors.note = `Keep the note to ${CLIENT_LIMITS.note} characters.`;
  if (!clientId) errors.day ??= 'Close this form and open it again.';
  return { clientId, day, note, errors, ok: !errors.day && !errors.note };
}
