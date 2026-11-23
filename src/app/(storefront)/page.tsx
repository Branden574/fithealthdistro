import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { HomeView } from '@/components/storefront/HomeView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { t } from '@/lib/copy';
import { getStorefrontPageData } from '@/lib/content/page-data';
import { getPublishedCopy } from '@/lib/content/storefront';
import { absoluteUrl, BUSINESS_NAME, LOGO_IMAGE, shareMetadata } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublishedCopy();
  // One address for the home page, so "?category=drinks" and the like count as the same page.
  return shareMetadata({ title: t(copy, 'meta.title'), description: t(copy, 'meta.description'), path: '/' });
}

/** The storefront. Static: every read is cached and expires when a publish or a product change says so. */
export default async function HomePage() {
  const { copy, faqs, catalog, settings } = await getStorefrontPageData();
  const contact = {
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
  };
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl(LOGO_IMAGE),
    description: t(copy, 'meta.description'),
    ...contact,
    ...(Object.keys(contact).length ? { contactPoint: { '@type': 'ContactPoint', contactType: 'sales', ...contact } } : {}),
  };
  return (
    <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings}>
      <JsonLd data={organization} />
      <HomeView copy={copy} faqs={faqs} catalog={catalog} />
    </StorefrontShell>
  );
}
