import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Says what is missing: "No products yet". */
  title: string;
  /** One sentence on what to do about it. */
  description?: React.ReactNode;
  icon?: IconName;
  /** One button that fixes it: "Add product". */
  action?: React.ReactNode;
  /** Less padding, for use inside a table or a small panel. */
  compact?: boolean;
}

/** What a list shows before it has anything in it, with the one action that fills it. */
export function EmptyState(props: EmptyStateProps) {
  const { title, description, icon = 'tray', action, compact, className, ...rest } = props;
  return (
    <div className={cx('fhd-empty', compact && 'fhd-empty--compact', className)} {...rest}>
      <span className="fhd-empty__icon" aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <p className="fhd-empty__title">{title}</p>
      {description ? <p className="fhd-empty__desc">{description}</p> : null}
      {action ? <div className="fhd-empty__action">{action}</div> : null}
    </div>
  );
}
