import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** `primary` is the volt fill: the one call to action in a view. `solid` is ink. `outline` (default) and `ghost` are for everything else. `danger` deletes. */
  variant?: 'primary' | 'solid' | 'outline' | 'ghost' | 'danger';
  /** `sm` 32px for table rows and filters, `md` 40px, `lg` 48px for the storefront. */
  size?: 'sm' | 'md' | 'lg';
  /** Icon before the label. */
  iconLeft?: IconName;
  /** Icon after the label. */
  iconRight?: IconName;
  /** Makes a square, icon-only button. Give it an `aria-label`. */
  icon?: IconName;
  /** Shows a spinner in place of the left icon and blocks clicks. */
  loading?: boolean;
  /** Stretches the button to its container's width. */
  block?: boolean;
  /** Renders a link that looks like a button. */
  href?: string;
  /**
   * With `href`, opens the page in a new tab (`rel="noopener noreferrer"` is added). Give `newTabLabel` too, so screen
   * readers hear where the link goes.
   */
  newTab?: boolean;
  /** Read after the label on a `newTab` link: "(opens in a new tab)". Not shown. */
  newTabLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}

/** The action control. Label in uppercase Big Shoulders, 2px edge, 2px corners. */
export function Button(props: ButtonProps) {
  const {
    variant = 'outline',
    size = 'md',
    iconLeft,
    iconRight,
    icon,
    loading,
    block,
    href,
    newTab,
    newTabLabel,
    type = 'button',
    className,
    children,
    disabled,
    ...rest
  } = props;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const classes = cx(
    'fhd-btn',
    `fhd-btn--${variant}`,
    size !== 'md' && `fhd-btn--${size}`,
    icon && 'fhd-btn--icon',
    block && 'fhd-btn--block',
    loading && 'fhd-btn--loading',
    className,
  );
  const content = (
    <>
      {loading ? (
        <span className="fhd-btn__spinner" aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={iconSize} />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} />
      ) : null}
      {children != null && !icon ? <span className="fhd-btn__label">{children}</span> : null}
      {iconRight && !icon ? <Icon name={iconRight} size={iconSize} /> : null}
      {href != null && newTab && newTabLabel ? <span className="fhd-sr"> {newTabLabel}</span> : null}
    </>
  );
  if (href != null) {
    const off = disabled || loading;
    return (
      <a
        className={classes}
        href={off ? undefined : href}
        aria-disabled={off ? true : undefined}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        {...(rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }
  return (
    <button className={classes} type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
