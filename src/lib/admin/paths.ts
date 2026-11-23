/** Admin addresses, shared by the proxy, the pages and the actions. */
export const ADMIN_HOME = '/admin';
export const SIGN_IN_PATH = '/admin/sign-in';
export const PRODUCTS_PATH = '/admin/products';
export const CATEGORIES_PATH = '/admin/categories';

/**
 * Where to go after signing in: an admin page the visitor was sent away from, or the admin home. Anything else (another
 * site, a protocol-relative "//host", odd characters) falls back to the home, so the sign-in page cannot be used to
 * bounce people to another site.
 */
export function afterSignIn(next: unknown): string {
  if (typeof next !== 'string' || next.length > 200) return ADMIN_HOME;
  return /^\/admin(\/[a-z0-9-]+)*$/.test(next) && next !== SIGN_IN_PATH ? next : ADMIN_HOME;
}
