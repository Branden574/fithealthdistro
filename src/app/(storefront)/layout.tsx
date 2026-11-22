import type { ReactNode } from 'react';
import { RevealObserver } from '@/components/motion/RevealObserver';
import { SiteFooter } from '@/components/storefront/SiteFooter';
import { SiteNav } from '@/components/storefront/SiteNav';
import { t } from '@/lib/copy';
import { getPublishedCopy } from '@/lib/copy/published';

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const copy = await getPublishedCopy();
  return (
    <>
      <a className="skip-link" href="#main">
        {t(copy, 'a11y.skip')}
      </a>
      <SiteNav copy={copy} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter copy={copy} />
      <RevealObserver />
    </>
  );
}
