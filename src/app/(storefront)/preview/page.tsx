import type { Metadata } from 'next';
import { PreviewBar } from '@/components/admin/PreviewBar';
import { HomeView } from '@/components/storefront/HomeView';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { PREVIEW_PATH } from '@/lib/admin/paths';
import { getPreviewPageData } from '@/lib/content/preview';

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

/** The home page from saved drafts, for admins to check before they publish. */
export default async function PreviewHomePage() {
  const { copy, faqs, catalog, settings } = await getPreviewPageData();
  return (
    <>
      <PreviewBar current="home" />
      <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings} previewBase={PREVIEW_PATH}>
        <HomeView copy={copy} faqs={faqs} catalog={catalog} preview linkBase={PREVIEW_PATH} />
      </StorefrontShell>
    </>
  );
}
