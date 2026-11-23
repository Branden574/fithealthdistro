import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { type Tone } from './types';
import { cx } from './util';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** What the badge means. `accent` is orange (New, Featured), `solid` is ink, the rest are status tones. */
  tone?: Tone | 'solid';
  /** Leading status dot. */
  dot?: boolean;
  /** Leading icon, instead of the dot. */
  icon?: IconName;
}

/** One or two words of status. The word carries the meaning; the tone backs it up. */
export function Badge(props: BadgeProps) {
  const { tone = 'neutral', dot, icon, className, children, ...rest } = props;
  return (
    <span className={cx('fhd-badge', `fhd-badge--${tone}`, className)} {...rest}>
      {icon ? <Icon name={icon} size={14} /> : dot ? <span className="fhd-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
