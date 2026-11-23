import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PreviewBar } from '@/components/admin/PreviewBar';
import { ProductView } from '@/components/storefront/ProductView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { PREVIEW_PATH } from '@/lib/admin/paths';
import { getProduct } from '@/lib/catalog';
import { getPreviewPageData } from '@/lib/content/preview';

/** Reads the session on every request, like the rest of the preview. Its links are plain page loads. */
export const instant = false;

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

/** A product's page from saved drafts. The product itself is the live one: products have no drafts. */
export default async function PreviewProductPage({ params }: PageProps<'/preview/products/[slug]'>) {
  // The allowlist is checked before anything else is read.
  const data = await getPreviewPageData();
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return (
    <>
      <PreviewBar current="product" />
      <StorefrontShell copy={data.copy} catalog={data.catalog} hasFaq={data.faqs.length > 0} settings={data.settings} onHome={false} previewBase={PREVIEW_PATH}>
        <ProductView copy={data.copy} product={product} linkBase={PREVIEW_PATH} />
      </StorefrontShell>
    </>
  );
}
