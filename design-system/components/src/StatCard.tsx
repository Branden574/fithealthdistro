import * as React from 'react';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface StatCardDelta {
  /** The change, written out: "+4 pts", "-12", "No change". */
  label: string;
  /** Which arrow to show. */
  direction?: 'up' | 'down' | 'flat';
  /** Whether the change is good news. Defaults to up = success, down = danger, flat = neutral; set it when down is good. */
  tone?: 'success' | 'danger' | 'neutral';
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What is being counted, as an eyebrow: "Client retention". */
  label: string;
  /** The number. */
  value: React.ReactNode;
  /** Set at half size after the number: "%", "days". */
  unit?: string;
  /** Change against the comparison period. */
  delta?: StatCardDelta;
  /** Names the comparison period: "vs. previous 90 days". */
  helper?: string;
  /** Puts the volt highlighter behind the number. One per row of cards. */
  highlight?: boolean;
  /** A glyph in the top corner. */
  icon?: IconName;
  /** `inverse` paints the card near-black with a volt rule, to single out one figure on a light page. */
  tone?: 'default' | 'inverse';
  /** Up to 12 recent values drawn as small bars; the last is volt. */
  trend?: number[];
}

/** One business figure for the admin dashboard, with its change and comparison period. */
export function StatCard(props: StatCardProps) {
  const { label, value, unit, delta, helper, highlight, icon, tone = 'default', trend, className, ...rest } = props;
  const direction = delta ? delta.direction ?? 'flat' : 'flat';
  const deltaTone = delta ? delta.tone ?? (direction === 'up' ? 'success' : direction === 'down' ? 'danger' : 'neutral') : 'neutral';
  const peak = trend && trend.length ? Math.max(...trend, 0) || 1 : 1;
  return (
    <div
      className={cx('fhd-stat', highlight && 'fhd-stat--highlight', tone === 'inverse' && 'fhd-stat--inverse', className)}
      data-theme={tone === 'inverse' ? 'dark' : undefined}
      {...rest}
    >
      <div className="fhd-stat__head">
        <span className="fhd-stat__label">{label}</span>
        {icon ? <Icon name={icon} size={20} className="fhd-stat__icon" /> : null}
      </div>
      <div className="fhd-stat__value">
        <span className="fhd-stat__mark">
          {value}
          {unit ? <span className="fhd-stat__unit">{unit}</span> : null}
        </span>
      </div>
      {trend && trend.length ? (
        <div className="fhd-stat__spark" aria-hidden="true">
          {trend.slice(-12).map((point, index) => (
            <i key={index} style={{ height: `${Math.max(6, (point / peak) * 100)}%` }} />
          ))}
        </div>
      ) : null}
      {delta || helper ? (
        <div className="fhd-stat__foot">
          {delta ? (
            <span className={cx('fhd-stat__delta', `fhd-stat__delta--${deltaTone}`)}>
              <Icon name={direction === 'up' ? 'trend-up' : direction === 'down' ? 'trend-down' : 'minus'} size={14} />
              {delta.label}
            </span>
          ) : null}
          {helper ? <span>{helper}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
