import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductView } from '@/components/storefront/ProductView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { getProduct, getProductSlugs } from '@/lib/catalog';
import { getStorefrontPageData } from '@/lib/content/page-data';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Allowed to block. Pages for the products listed below are built ahead of time and open instantly; a product added
 * since is rendered on its first visit. Blocking for that one visit keeps a real 404 status for hidden and unknown
 * products, which streaming a placeholder first could not.
 */
export const instant = false;

/** Every visible product's page is built ahead of time; one added later is built on its first visit. */
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  // Cache Components needs at least one. With an empty catalog this one shows the not-found page.
  return (slugs.length ? slugs : ['no-products']).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return { title: product.name, description: product.description || undefined };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [data, product] = await Promise.all([getStorefrontPageData(), getProduct(slug)]);
  if (!product) notFound();
  return (
    <StorefrontShell copy={data.copy} catalog={data.catalog} hasFaq={data.faqs.length > 0} settings={data.settings} onHome={false}>
      <ProductView copy={data.copy} product={product} />
    </StorefrontShell>
  );
}
