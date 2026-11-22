import * as React from 'react';
import { cx } from './util';

export interface BarChartDatum {
  /** Tick under the bar: "Jun". */
  label: string;
  value: number;
}

export interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  data: BarChartDatum[];
  /** One sentence that says what the chart shows, read out before the values. */
  ariaLabel: string;
  /** Top of the scale. Defaults to 100 when `unit` is "%", otherwise the largest value rounded up to a clean step. */
  max?: number;
  /** Appended to values and scale labels: "%". */
  unit?: string;
  /** Index of the bar drawn in volt. Defaults to the last bar; pass -1 for none. */
  highlight?: number;
  /** Plot height in px. */
  height?: number;
  /** Prints each value above its bar. */
  showValues?: boolean;
}

function cleanMax(value: number): number {
  if (value <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const lead = value / power;
  return (lead <= 1 ? 1 : lead <= 2 ? 2 : lead <= 5 ? 5 : 10) * power;
}

/** Vertical bars over time: retention by month, inquiries by week. Ink bars, one volt bar for the period that matters. */
export function BarChart(props: BarChartProps) {
  const { data, ariaLabel, max, unit = '', highlight, height = 200, showValues = false, className, ...rest } = props;
  const peak = data.reduce((top, datum) => Math.max(top, datum.value), 0);
  const top = max ?? (unit === '%' && peak <= 100 ? 100 : cleanMax(peak));
  const hi = highlight ?? data.length - 1;
  const summary = `${ariaLabel} ${data.map((datum) => `${datum.label}: ${datum.value}${unit}`).join(', ')}.`;
  return (
    <div className={cx('fhd-chart', className)} {...rest}>
      <div className="fhd-chart__plot" role="img" aria-label={summary} style={{ height }}>
        <div className="fhd-chart__scale" aria-hidden="true">
          <span style={{ bottom: '100%' }}>
            {top}
            {unit}
          </span>
          <span style={{ bottom: '50%' }}>
            {top / 2}
            {unit}
          </span>
          <span style={{ bottom: 0 }}>0</span>
        </div>
        <div className="fhd-chart__area" aria-hidden="true">
          <i className="fhd-chart__grid" style={{ bottom: '100%' }} />
          <i className="fhd-chart__grid" style={{ bottom: '50%' }} />
          {data.map((datum, index) => (
            <div key={datum.label + index} className={cx('fhd-chart__col', index === hi && 'fhd-chart__col--hi')}>
              <div className="fhd-chart__bar" style={{ height: `${Math.max(0, Math.min(100, (datum.value / top) * 100))}%` }}>
                {showValues ? (
                  <span className="fhd-chart__val">
                    {datum.value}
                    {unit}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fhd-chart__axis" aria-hidden="true">
        {data.map((datum, index) => (
          <span key={datum.label + index} className="fhd-chart__tick">
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}
