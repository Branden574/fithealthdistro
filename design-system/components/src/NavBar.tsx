import * as React from 'react';
import { Icon } from './Icon';
import { Wordmark } from './Wordmark';
import { cx } from './util';

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  links: NavLink[];
  /** The `id` of the link for the page being shown. */
  current?: string;
  /** Replaces the wordmark: a logo image once there is one. */
  brand?: React.ReactNode;
  brandHref?: string;
  /** Buttons at the far right. At most one of them `primary`. */
  actions?: React.ReactNode;
  /** The bar's own theme. `dark` by default, so the storefront opens on a black band; `inherit` follows the page. */
  theme?: 'dark' | 'light' | 'inherit';
  /** Intercept a link click, for client-side routing. */
  onNavigate?: (link: NavLink, event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Accessible name of the navigation landmark. */
  label?: string;
}

/** The storefront's top bar: wordmark, section links, and the quote button. Collapses to a menu under 760px. */
export function NavBar(props: NavBarProps) {
  const { links, current, brand, brandHref = '/', actions, theme = 'dark', onNavigate, label = 'Main', className, ...rest } = props;
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  return (
    <header className={cx('fhd-nav', open && 'fhd-nav--open', className)} data-theme={theme === 'inherit' ? undefined : theme} {...rest}>
      <a className="fhd-nav__brand" href={brandHref}>
        {brand ?? <Wordmark />}
      </a>
      <button
        type="button"
        className="fhd-nav__toggle"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? 'x' : 'list'} size={24} />
      </button>
      <div className="fhd-nav__menu" id={menuId}>
        <nav aria-label={label}>
          <ul className="fhd-nav__links">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  className="fhd-nav__link"
                  href={link.href}
                  aria-current={link.id === current ? 'page' : undefined}
                  onClick={onNavigate ? (event) => onNavigate(link, event) : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {actions ? <div className="fhd-nav__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
