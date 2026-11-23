import type { Metadata } from 'next';
import { PreviewBar } from '@/components/admin/PreviewBar';
import { LegalPage } from '@/components/storefront/LegalPage';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { PREVIEW_PATH } from '@/lib/admin/paths';
import { getPreviewPageData } from '@/lib/content/preview';

/** Reads the session on every request, like the rest of the preview. Its links are plain page loads. */
export const instant = false;

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

/** The Terms page from saved drafts, for admins to check before they publish. */
export default async function PreviewTermsPage() {
  const { copy, faqs, catalog, settings } = await getPreviewPageData();
  return (
    <>
      <PreviewBar current="terms" />
      <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings} onHome={false} previewBase={PREVIEW_PATH}>
        <LegalPage copy={copy} prefix="terms" />
      </StorefrontShell>
    </>
  );
}
