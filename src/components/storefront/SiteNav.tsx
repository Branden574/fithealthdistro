'use client';

import { Button, NavBar, type NavLink } from '@ds';
import { isModifiedClick, showCategory } from '@/lib/catalog/filter';
import { CATEGORY_LINK } from '@/lib/catalog/links';

interface SiteNavProps {
  /** Category links first (ids `category:<slug>`), then FAQ when there is one, then Contact. */
  links: NavLink[];
  label: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  cta: { label: string; href: string };
  /** Where the wordmark leads: the home page, or the draft preview's. */
  homeHref?: string;
}

/** The storefront's top bar. On the home page a category link filters the catalog in place instead of reloading it. */
export function SiteNav({ links, label, openMenuLabel, closeMenuLabel, cta, homeHref = '/' }: SiteNavProps) {
  return (
    <NavBar
      className="site-nav"
      brandHref={homeHref}
      links={links}
      label={label}
      openMenuLabel={openMenuLabel}
      closeMenuLabel={closeMenuLabel}
      onNavigate={(link, event) => {
        if (!link.id.startsWith(CATEGORY_LINK) || isModifiedClick(event)) return;
        if (showCategory(link.id.slice(CATEGORY_LINK.length))) event.preventDefault();
      }}
      actions={
        <Button variant="primary" size="sm" href={cta.href}>
          {cta.label}
        </Button>
      }
    />
  );
}
