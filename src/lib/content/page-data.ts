import 'server-only';
import { getCatalog, getPublicSettings, type Catalog, type PublicSettings } from '@/lib/catalog';
import type { Copy } from '@/lib/copy';
import { getStorefrontContent, type StorefrontFaq } from './storefront';

export interface StorefrontPageData {
  copy: Copy;
  faqs: StorefrontFaq[];
  catalog: Catalog;
  settings: PublicSettings;
}

/** What every storefront page needs for its nav bar and footer, from the cached published reads. */
export async function getStorefrontPageData(): Promise<StorefrontPageData> {
  const [{ copy, faqs }, catalog, settings] = await Promise.all([getStorefrontContent(), getCatalog(), getPublicSettings()]);
  return { copy, faqs, catalog, settings };
}
