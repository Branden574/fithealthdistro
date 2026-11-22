import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  /** A bold first line. The body goes in `children`. */
  title?: React.ReactNode;
  /** Overrides the tone's icon. */
  icon?: IconName;
  /** A small button or link on the right: "Undo", "View". */
  action?: React.ReactNode;
  /** Shows a close button and is called when it is pressed. */
  onDismiss?: () => void;
  /** Accessible name of the close button. */
  dismissLabel?: string;
}

const ICONS: Record<NonNullable<AlertProps['tone']>, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'warning-circle',
};

/** A message in the flow of the page: a save confirmed, a product hidden, a form that failed. */
export function Alert(props: AlertProps) {
  const { tone = 'neutral', title, icon, action, onDismiss, dismissLabel = 'Dismiss', className, children, ...rest } = props;
  return (
    <div className={cx('fhd-alert', `fhd-alert--${tone}`, className)} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} {...rest}>
      <Icon name={icon ?? ICONS[tone]} size={20} className="fhd-alert__icon" />
      <div className="fhd-alert__body">
        {title ? <p className="fhd-alert__title">{title}</p> : null}
        {children != null ? <div className="fhd-alert__text">{children}</div> : null}
      </div>
      {action ? <div className="fhd-alert__action">{action}</div> : null}
      {onDismiss ? (
        <button type="button" className="fhd-alert__close" aria-label={dismissLabel} onClick={onDismiss}>
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
