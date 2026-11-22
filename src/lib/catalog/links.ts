/** Link conventions shared by the server-rendered page and the client code that handles the links. */

/** The catalog section's id: the target of every category link. */
export const CATALOG_ID = 'catalog';

/** A nav link whose id starts with this filters the catalog to the category slug that follows. */
export const CATEGORY_LINK = 'category:';

/** A product's own page. */
export function productHref(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}

/** Where a category link points: the home page's catalog, filtered. Works as a plain link without the script. */
export function categoryHref(slug: string): string {
  return `/?category=${encodeURIComponent(slug)}#${CATALOG_ID}`;
}
