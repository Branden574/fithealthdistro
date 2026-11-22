import * as React from 'react';
import { cx } from './util';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The panel's heading, set in uppercase Big Shoulders. */
  title?: React.ReactNode;
  /** A line under the title. */
  description?: React.ReactNode;
  /** Buttons or a filter at the top right. */
  actions?: React.ReactNode;
  /** A quiet line along the bottom: "Showing 8 of 42". */
  footer?: React.ReactNode;
  /** Drops the body padding so a DataTable runs edge to edge. */
  flush?: boolean;
  /** `inverse` paints the panel near-black, to single out one block on a light page. */
  tone?: 'default' | 'inverse';
}

/** The container for one block of the admin: a chart, a table, a form. */
export function Panel(props: PanelProps) {
  const { title, description, actions, footer, flush, tone = 'default', className, children, ...rest } = props;
  return (
    <section
      className={cx('fhd-panel', flush && 'fhd-panel--flush', tone === 'inverse' && 'fhd-panel--inverse', className)}
      data-theme={tone === 'inverse' ? 'dark' : undefined}
      {...rest}
    >
      {title || actions ? (
        <header className="fhd-panel__head">
          <div>
            {title ? <h2 className="fhd-panel__title">{title}</h2> : null}
            {description ? <p className="fhd-panel__desc">{description}</p> : null}
          </div>
          {actions ? <div className="fhd-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="fhd-panel__body">{children}</div>
      {footer ? <footer className="fhd-panel__foot">{footer}</footer> : null}
    </section>
  );
}
