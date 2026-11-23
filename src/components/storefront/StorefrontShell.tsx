import type { ReactNode } from 'react';
import type { NavLink } from '@ds';
import type { Catalog, PublicSettings } from '@/lib/catalog';
import { t, type Copy } from '@/lib/copy';
import { RevealObserver } from '@/components/motion/RevealObserver';
import { CATEGORY_LINK, categoryHref, homeHref } from '@/lib/catalog/links';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

interface StorefrontShellProps {
  copy: Copy;
  catalog: Catalog;
  /** Whether the page has an FAQ section to link to. */
  hasFaq: boolean;
  settings: PublicSettings;
  /**
   * True on the page that holds the sections, so its links stay on the page ("#contact" keeps a filtered catalog's
   * address). Elsewhere they lead back to the home page.
   */
  onHome?: boolean;
  /** The admin's draft preview ("/preview"): links between the home and legal pages stay inside it. */
  previewBase?: string;
  children: ReactNode;
}

/** Skip link, nav bar, the page, and the footer. */
export function StorefrontShell({ copy, catalog, hasFaq, settings, onHome = true, previewBase, children }: StorefrontShellProps) {
  // On the home page a bare "#contact" keeps a filtered catalog's address; elsewhere links lead to the home page.
  const section = (hash: string) => (onHome ? `#${hash}` : homeHref(previewBase ?? '', hash));
  const links: NavLink[] = [
    ...catalog.categories.map((category) => ({
      id: CATEGORY_LINK + category.slug,
      label: category.name,
      href: categoryHref(category.slug, previewBase),
    })),
    ...(hasFaq ? [{ id: 'faq', label: t(copy, 'nav.faq'), href: section('faq') }] : []),
    { id: 'contact', label: t(copy, 'nav.contact'), href: section('contact') },
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        {t(copy, 'a11y.skip')}
      </a>
      <SiteNav
        links={links}
        label={t(copy, 'nav.label')}
        openMenuLabel={t(copy, 'nav.menu.open')}
        closeMenuLabel={t(copy, 'nav.menu.close')}
        cta={{ label: t(copy, 'nav.cta'), href: section('contact') }}
        homeHref={homeHref(previewBase ?? '')}
      />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter copy={copy} settings={settings} linkBase={previewBase} />
      {/* Inside the page, not the layout, so it runs only once the sections it marks have hydrated. */}
      <RevealObserver />
    </>
  );
}
