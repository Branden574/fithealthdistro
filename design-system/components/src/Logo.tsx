import * as React from 'react';
import { LOGO, MARK } from './logo-paths';
import { cx } from './util';

export interface LogoProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'height' | 'width'> {
  /** `full`: FHD over FIT HEALTH over DISTRIBUTING, with its speed lines. `mark`: FHD alone, for spots too tight for the rest. */
  variant?: 'full' | 'mark';
  /** Height in px; the width follows the logo's proportions. 40 in the NavBar, 36 in the Sidebar, 64 in the footer. */
  height?: number;
  /** Its accessible name. Pass '' when the name is written out beside it, so it is not read twice. */
  title?: string;
}

/**
 * The company logo. The letters take the current text color, so they are ink on light and near-white on a dark band;
 * the D and the speed lines are the brand orange.
 */
export function Logo(props: LogoProps) {
  const { variant = 'full', height = 40, title = 'Fit Health Distributing', className, ...rest } = props;
  const art = variant === 'mark' ? MARK : LOGO;
  const width = Math.round((height * art.width) / art.height);
  return (
    <svg
      className={cx('fhd-logo', className)}
      viewBox={`0 0 ${art.width} ${art.height}`}
      width={width}
      height={height}
      focusable="false"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
      {...rest}
    >
      <path className="fhd-logo__letters" d={art.letters} />
      <path className="fhd-logo__accent" d={art.accent} />
    </svg>
  );
}
