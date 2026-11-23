import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductView } from '@/components/storefront/ProductView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { getProduct, getProductSlugs, type ProductDetail, type StockStatus } from '@/lib/catalog';
import { productHref } from '@/lib/catalog/links';
import { getStorefrontPageData } from '@/lib/content/page-data';
import { absoluteUrl, BUSINESS_NAME, shareMetadata } from '@/lib/site';

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
  const description = product.description || undefined;
  return {
    title: product.name,
    description,
    ...shareMetadata({
      title: product.name,
      description,
      path: productHref(product.slug),
      image: product.imageUrl ? { url: product.imageUrl, alt: product.name } : null,
    }),
    // A sample stands in until real products are added; search engines should not list it.
    ...(product.isSample ? { robots: { index: false, follow: true } } : {}),
  };
}

const AVAILABILITY: Record<StockStatus, string> = {
  in_stock: 'https://schema.org/InStock',
  low_stock: 'https://schema.org/LimitedAvailability',
  out_of_stock: 'https://schema.org/OutOfStock',
};

/** The product for search engines, from what the page itself shows. A price is only offered when the page lists one. */
function productData(product: ProductDetail) {
  const url = absoluteUrl(productHref(product.slug));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    category: product.category.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.photos.length ? { image: product.photos } : {}),
    ...(product.price != null && product.price > 0
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: product.price.toFixed(2),
            priceCurrency: 'USD',
            availability: AVAILABILITY[product.stock],
            seller: { '@type': 'Organization', name: BUSINESS_NAME },
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [data, product] = await Promise.all([getStorefrontPageData(), getProduct(slug)]);
  if (!product) notFound();
  return (
    <StorefrontShell copy={data.copy} catalog={data.catalog} hasFaq={data.faqs.length > 0} settings={data.settings} onHome={false}>
      {product.isSample ? null : <JsonLd data={productData(product)} />}
      <ProductView copy={data.copy} product={product} />
    </StorefrontShell>
  );
}
