import { Button, EmptyState } from '@ds';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { CATALOG_ID } from '@/lib/catalog/links';
import { t } from '@/lib/copy';
import { getStorefrontPageData } from '@/lib/content/page-data';

/** A product that is hidden, removed or never existed. */
export default async function ProductNotFound() {
  const { copy, faqs, catalog, settings } = await getStorefrontPageData();
  return (
    <StorefrontShell copy={copy} catalog={catalog} hasFaq={faqs.length > 0} settings={settings} onHome={false}>
      <section className="section">
        <div className="wrap wrap--narrow">
          <EmptyState
            icon="package"
            title={t(copy, 'product.missing.title')}
            description={t(copy, 'product.missing.body')}
            action={
              <Button variant="primary" href={`/#${CATALOG_ID}`} iconRight="arrow-right">
                {t(copy, 'product.back')}
              </Button>
            }
          />
        </div>
      </section>
    </StorefrontShell>
  );
}
