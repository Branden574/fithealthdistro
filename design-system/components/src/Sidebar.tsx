import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { Logo } from './Logo';
import { cx, initials } from './util';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: IconName;
  /** A count in a pill at the right: unread inquiries. */
  count?: number;
  /** Renders a link. Without it the item is a button and `onSelect` does the work. */
  href?: string;
}

export interface SidebarSection {
  /** An eyebrow over the group: "Catalog". */
  title?: string;
  items: SidebarItem[];
}

export interface SidebarUser {
  name: string;
  /** "Owner", "Admin". */
  role?: string;
  /** Shows a sign-out button. */
  onSignOut?: () => void;
}

export interface SidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  sections: SidebarSection[];
  /** The `id` of the item for the page being shown. */
  current?: string;
  onSelect?: (id: string, event: React.MouseEvent<HTMLElement>) => void;
  /** Replaces the logo at the top. */
  brand?: React.ReactNode;
  /** The signed-in admin, shown at the bottom. */
  user?: SidebarUser;
  /** The sidebar's own theme. `dark` by default, against a light admin canvas; `inherit` follows the page. */
  theme?: 'dark' | 'light' | 'inherit';
  /** Accessible name of the navigation landmark. */
  label?: string;
  /** Text of the button that opens the full list on a phone. */
  menuLabel?: string;
}

/** The admin's navigation rail. The current page is an orange block. On a phone it folds into a Menu button. */
export function Sidebar(props: SidebarProps) {
  const { sections, current, onSelect, brand, user, theme = 'dark', label = 'Admin', menuLabel = 'Menu', className, ...rest } = props;
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const toggle = React.useRef<HTMLButtonElement>(null);
  const select = (id: string, event: React.MouseEvent<HTMLElement>) => {
    // Choosing a page closes the phone menu, so the page is not left under it.
    setOpen(false);
    if (onSelect) onSelect(id, event);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(event);
    // Escape closes the open menu and puts focus back on its button.
    if (event.key === 'Escape' && open) {
      setOpen(false);
      if (toggle.current) toggle.current.focus();
    }
  };
  return (
    <aside
      className={cx('fhd-side', open && 'fhd-side--open', className)}
      data-theme={theme === 'inherit' ? undefined : theme}
      {...rest}
      onKeyDown={onKeyDown}
    >
      <div className="fhd-side__brand">
        {brand ?? <Logo height={36} />}
        <button
          ref={toggle}
          type="button"
          className="fhd-side__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'x' : 'list'} size={20} />
          <span>{menuLabel}</span>
        </button>
      </div>
      <div className="fhd-side__panel" id={panelId}>
        <nav className="fhd-side__nav" aria-label={label}>
          {sections.map((section, index) => (
            <div key={section.title ?? index}>
              {section.title ? <p className="fhd-side__title">{section.title}</p> : null}
              <ul className="fhd-side__list">
                {section.items.map((item) => {
                  const active = item.id === current;
                  const inner = (
                    <>
                      {item.icon ? <Icon name={item.icon} size={20} /> : null}
                      <span className="fhd-side__label">{item.label}</span>
                      {item.count != null ? <span className="fhd-side__count">{item.count}</span> : null}
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.href != null ? (
                        <a
                          className="fhd-side__item"
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          onClick={(event) => select(item.id, event)}
                        >
                          {inner}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="fhd-side__item"
                          aria-current={active ? 'page' : undefined}
                          onClick={(event) => select(item.id, event)}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {user ? (
          <div className="fhd-side__user">
            <span className="fhd-side__avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="fhd-side__who">
              <span className="fhd-side__name">{user.name}</span>
              {user.role ? <span className="fhd-side__role">{user.role}</span> : null}
            </span>
            {user.onSignOut ? (
              <button type="button" className="fhd-side__signout" aria-label="Sign out" onClick={user.onSignOut}>
                <Icon name="sign-out" size={20} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
