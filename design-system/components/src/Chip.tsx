import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** The filter is on. Drawn as an ink fill. */
  selected?: boolean;
  /** How many results the filter holds, shown in mono after the label. */
  count?: number;
  /** Leading icon. */
  icon?: IconName;
}

/** A filter toggle: category filters in the catalog, status filters in the admin. */
export function Chip(props: ChipProps) {
  const { selected = false, count, icon, className, children, ...rest } = props;
  return (
    <button type="button" className={cx('fhd-chip', className)} aria-pressed={selected} {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {count != null ? <span className="fhd-chip__count">{count}</span> : null}
    </button>
  );
}
