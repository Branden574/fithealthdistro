import type { Metadata } from 'next';
import { LegalPage } from '@/components/storefront/LegalPage';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { t } from '@/lib/copy';
import { getStorefrontPageData } from '@/lib/content/page-data';
import { getPublishedCopy } from '@/lib/content/storefront';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPublishedCopy();
  return { title: t(copy, 'privacy.title') };
}

/** The Privacy page. Its wording is site copy, edited and published in the admin like the rest of the site. */
export default async function PrivacyPage() {
  const { copy, faqs, catalog, settings } = await getStorefrontPageData();
  return (
    <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings} onHome={false}>
      <LegalPage copy={copy} prefix="privacy" />
    </StorefrontShell>
  );
}
