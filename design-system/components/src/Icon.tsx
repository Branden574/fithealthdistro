import * as React from 'react';
import { ICONS, type IconName } from './icons';
import { cx } from './util';

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'name'> {
  /** Glyph name from the Phosphor Bold subset in `assets/Icons`. */
  name: IconName;
  /** Box size in px: 16 inside small controls, 20 by default, 24 standing alone. */
  size?: number;
  /** Accessible name. Leave it out for a decorative icon, which is then hidden from assistive tech. */
  label?: string;
}

/** One Phosphor Bold glyph, drawn inline so it takes the current text color. */
export function Icon(props: IconProps) {
  const { name, size = 20, label, className, ...rest } = props;
  return (
    <svg
      className={cx('fhd-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Every glyph name in the set, in catalog order. */
Icon.names = Object.keys(ICONS) as IconName[];
