/** Settings forms: shared by the dialogs and panels in the browser and the actions on the server. */

export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^[0-9+().\-\s]*$/;
const CONTROL = new RegExp(`[${String.fromCodePoint(0)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`, 'g');

export const SETTINGS_LIMITS = { email: 254, phone: 40, name: 80, passwordMin: 12, passwordMax: 72 } as const;

function line(form: FormData, name: string): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.slice(0, 1000).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim() : '';
}

export interface ContactFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'error';
  errors?: { email?: string; phone?: string };
  attempt: number;
}

export function readContactForm(form: FormData) {
  const email = line(form, 'email');
  const phone = line(form, 'phone');
  const errors: NonNullable<ContactFormState['errors']> = {};
  if (email && (email.length > SETTINGS_LIMITS.email || !EMAIL.test(email))) errors.email = 'Enter an email address like name@example.com, or leave it empty.';
  if (phone.length > SETTINGS_LIMITS.phone) errors.phone = `Keep the phone number to ${SETTINGS_LIMITS.phone} characters.`;
  else if (!PHONE.test(phone)) errors.phone = 'Use digits, spaces, and + ( ) - only.';
  return { email, phone, errors, ok: !errors.email && !errors.phone };
}

export interface AddAdminState {
  status: 'idle' | 'invalid' | 'added' | 'signed-out' | 'error';
  errors?: { name?: string; email?: string };
  attempt: number;
  name?: string;
  email?: string;
  /** Only for an account made just now: shown once, never stored in the browser or logged. */
  password?: string;
}

export function readAddAdminForm(form: FormData) {
  const name = line(form, 'name');
  const email = line(form, 'email').toLowerCase();
  const errors: NonNullable<AddAdminState['errors']> = {};
  if (!name) errors.name = 'Give their name. It shows in the admin.';
  else if (name.length > SETTINGS_LIMITS.name) errors.name = `Keep the name to ${SETTINGS_LIMITS.name} characters.`;
  if (!email || email.length > SETTINGS_LIMITS.email || !EMAIL.test(email)) errors.email = 'Enter the email address they will sign in with.';
  return { name, email, errors, ok: !errors.name && !errors.email };
}

export interface NameFormState {
  status: 'idle' | 'invalid' | 'saved' | 'signed-out' | 'error';
  errors?: { name?: string };
  attempt: number;
}

export function readNameForm(form: FormData) {
  const name = line(form, 'name');
  const errors: NonNullable<NameFormState['errors']> = {};
  if (!name) errors.name = 'Give your name. It shows in the admin.';
  else if (name.length > SETTINGS_LIMITS.name) errors.name = `Keep the name to ${SETTINGS_LIMITS.name} characters.`;
  return { name, errors, ok: !errors.name };
}

export interface PasswordFormState {
  status: 'idle' | 'invalid' | 'saved' | 'limited' | 'signed-out' | 'error';
  errors?: { current?: string; next?: string; confirm?: string };
  attempt: number;
}

/** The password rules, the same as the sign-in service's: at least 12 characters with lower and upper case letters and a digit. */
export function passwordProblem(password: string): string | null {
  if (password.length < SETTINGS_LIMITS.passwordMin) return `Use at least ${SETTINGS_LIMITS.passwordMin} characters.`;
  if (new TextEncoder().encode(password).length > SETTINGS_LIMITS.passwordMax) return `Use ${SETTINGS_LIMITS.passwordMax} characters or fewer.`;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'Mix lower and upper case letters with at least one digit.';
  return null;
}

export function readPasswordForm(form: FormData) {
  const get = (name: string) => {
    const raw = form.get(name);
    return typeof raw === 'string' ? raw.slice(0, 200) : '';
  };
  const current = get('current');
  const next = get('next');
  const confirm = get('confirm');
  const errors: NonNullable<PasswordFormState['errors']> = {};
  if (!current) errors.current = 'Enter the password you signed in with.';
  const problem = passwordProblem(next);
  if (problem) errors.next = problem;
  else if (next === current) errors.next = 'Choose a password different from the one you have now.';
  if (!errors.next && confirm !== next) errors.confirm = 'Type the new password the same way twice.';
  return { current, next, errors, ok: !errors.current && !errors.next && !errors.confirm };
}
