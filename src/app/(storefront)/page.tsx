import { HomeView } from '@/components/storefront/HomeView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { getStorefrontPageData } from '@/lib/content/page-data';

/** The storefront. Static: every read is cached and expires when a publish or a product change says so. */
export default async function HomePage() {
  const { copy, faqs, catalog, settings } = await getStorefrontPageData();
  return (
    <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings}>
      <HomeView copy={copy} faqs={faqs} catalog={catalog} />
    </StorefrontShell>
  );
}
