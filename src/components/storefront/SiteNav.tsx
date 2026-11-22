import { Button, NavBar, type NavLink } from '@ds';
import { t, type Copy } from '@/lib/copy';

/** The storefront's top bar. Category links and the FAQ link arrive with the catalog and FAQ data. */
export function SiteNav({ copy, links = [] }: { copy: Copy; links?: NavLink[] }) {
  const all: NavLink[] = [...links, { id: 'contact', label: t(copy, 'nav.contact'), href: '/#contact' }];
  return (
    <NavBar
      className="site-nav"
      links={all}
      label={t(copy, 'nav.label')}
      openMenuLabel={t(copy, 'nav.menu.open')}
      closeMenuLabel={t(copy, 'nav.menu.close')}
      actions={
        <Button variant="primary" size="sm" href="/#contact">
          {t(copy, 'nav.cta')}
        </Button>
      }
    />
  );
}
