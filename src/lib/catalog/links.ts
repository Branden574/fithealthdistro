/** Link conventions shared by the server-rendered page and the client code that handles the links. */

/** The catalog section's id: the target of every category link. */
export const CATALOG_ID = 'catalog';

/** A nav link whose id starts with this filters the catalog to the category slug that follows. */
export const CATEGORY_LINK = 'category:';

/**
 * The links below take the site's root as `base`: empty for the live site, "/preview" for the admin's draft preview, so
 * a walk through the preview never lands on the live site by accident.
 */

/** A product's own page. */
export function productHref(slug: string, base = ''): string {
  return `${base}/products/${encodeURIComponent(slug)}`;
}

/** The home page, or a part of it: homeHref('', 'contact') is "/#contact". */
export function homeHref(base: string, hash?: string): string {
  return `${base || '/'}${hash ? `#${hash}` : ''}`;
}

/** Where a category link points: the home page's catalog, filtered. Works as a plain link without the script. */
export function categoryHref(slug: string, base = ''): string {
  return `${base || '/'}?category=${encodeURIComponent(slug)}#${CATALOG_ID}`;
}
