import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';
import { productHref } from '@/lib/catalog/links';
import { absoluteUrl } from '@/lib/site';

/**
 * Every page search engines should list: the home page, each real product and the two legal pages. Sample products are
 * left out (their pages ask not to be indexed). Cached with the catalog, so it changes when a product does.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalog();
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    ...products
      .filter((product) => !product.isSample)
      .map((product) => ({ url: absoluteUrl(productHref(product.slug)), changeFrequency: 'weekly' as const, priority: 0.8 })),
    { url: absoluteUrl('/terms'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
