/** Admin addresses, shared by the proxy, the pages and the actions. */
/** The dashboard. */
export const ADMIN_HOME = '/admin';
export const SIGN_IN_PATH = '/admin/sign-in';
export const PRODUCTS_PATH = '/admin/products';
export const CATEGORIES_PATH = '/admin/categories';
export const INQUIRIES_PATH = '/admin/inquiries';
export const CLIENTS_PATH = '/admin/clients';
export const RETENTION_PATH = '/admin/retention';
export const CONTENT_PATH = '/admin/content';
export const SETTINGS_PATH = '/admin/settings';
/** The storefront drawn from saved drafts. Admins only. */
export const PREVIEW_PATH = '/preview';

export const inquiryPath = (id: string) => `${INQUIRIES_PATH}/${id}`;

/** A spreadsheet download. See app/admin/export. */
export const exportPath = (kind: 'inquiries' | 'clients' | 'orders' | 'marketing') => `/admin/export/${kind}`;

/** One tab and page of the inquiry list: New is the plain address. */
export function inquiriesPath(status: 'new' | 'read' | 'replied', page = 1): string {
  const query = new URLSearchParams();
  if (status !== 'new') query.set('status', status);
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `${INQUIRIES_PATH}?${search}` : INQUIRIES_PATH;
}

/** One page of the client list, with the search that narrowed it. */
export function clientsPath(search = '', page = 1): string {
  const query = new URLSearchParams();
  if (search) query.set('q', search);
  if (page > 1) query.set('page', String(page));
  const value = query.toString();
  return value ? `${CLIENTS_PATH}?${value}` : CLIENTS_PATH;
}
export const clientPath = (id: string) => `${CLIENTS_PATH}/${id}`;

/** A page number from the address: 1 when it is missing or odd. */
export function pageNumber(raw: unknown): number {
  return typeof raw === 'string' && /^[1-9][0-9]{0,4}$/.test(raw) ? Number(raw) : 1;
}

/**
 * Where to go after signing in: an admin or preview page the visitor was sent away from, or the admin home. Anything else (another
 * site, a protocol-relative "//host", odd characters) falls back to the home, so the sign-in page cannot be used to
 * bounce people to another site.
 */
export function afterSignIn(next: unknown): string {
  if (typeof next !== 'string' || next.length > 200) return ADMIN_HOME;
  return /^\/(admin|preview)(\/[a-z0-9-]+)*$/.test(next) && next !== SIGN_IN_PATH ? next : ADMIN_HOME;
}
