import * as React from 'react';
import { cx } from './util';

export interface WordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Two lines, FIT HEALTH over DISTRIBUTION, for narrow columns. */
  stacked?: boolean;
  /** Font size in px. 24 in the nav bar, 20 in the sidebar. */
  size?: number;
  /** The short form, FHD, for spots too tight for the full name. */
  short?: boolean;
}

/** The company name set in Big Shoulders 900. Stands in for a logo until one exists. */
export function Wordmark(props: WordmarkProps) {
  const { stacked, size = 24, short, className, style, ...rest } = props;
  return (
    <span
      className={cx('fhd-wordmark', stacked && 'fhd-wordmark--stacked', className)}
      style={{ fontSize: size, ...style }}
      role={short ? 'img' : undefined}
      aria-label={short ? 'Fit Health Distribution' : undefined}
      {...rest}
    >
      {short ? (
        'FHD'
      ) : stacked ? (
        <>
          <span className="fhd-wordmark__line">Fit Health</span>
          <span className="fhd-wordmark__line">Distribution</span>
        </>
      ) : (
        'Fit Health Distribution'
      )}
    </span>
  );
}
