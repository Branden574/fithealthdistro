import * as React from 'react';
import { cx } from './util';

export interface BarChartDatum {
  /** Tick under the bar: "Jun". */
  label: string;
  /** The bar's value, or null when there is nothing to measure for that period. A null is drawn as a dash. */
  value: number | null;
}

export interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  data: BarChartDatum[];
  /** One sentence that says what the chart shows, read out before the values. */
  ariaLabel: string;
  /** Top of the scale. Defaults to 100 when `unit` is "%", otherwise the largest value rounded up to a clean step. */
  max?: number;
  /** Appended to values and scale labels: "%". */
  unit?: string;
  /** Writes a value as text, for values and scale labels alike: dollars, say. Overrides `unit` for the text. */
  format?: (value: number) => string;
  /** Read out for a null value. */
  emptyLabel?: string;
  /** Index of the bar drawn in orange. Defaults to the last bar; pass -1 for none. */
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

/**
 * Vertical bars over time: retention by month, inquiries by week. Ink bars, one orange bar for the period that matters.
 * Bars rise into place when the chart first shows and move to new heights when the data changes; under reduced motion
 * they are simply there.
 */
export function BarChart(props: BarChartProps) {
  const { data, ariaLabel, max, unit = '', format, emptyLabel = 'no data', highlight, height = 200, showValues = false, className, ...rest } = props;
  const text = format ?? ((value: number) => `${value}${unit}`);
  const peak = data.reduce((top, datum) => (datum.value == null ? top : Math.max(top, datum.value)), 0);
  const top = max ?? (unit === '%' && peak <= 100 ? 100 : cleanMax(peak));
  // With every value at zero and no set top there is no scale to read, so only the baseline is labelled.
  const scaled = max != null || unit === '%' || peak > 0;
  const hi = highlight ?? data.length - 1;
  const summary = `${ariaLabel} ${data.map((datum) => `${datum.label}: ${datum.value == null ? emptyLabel : text(datum.value)}`).join(', ')}.`;
  return (
    <div className={cx('fhd-chart', className)} {...rest}>
      <div className="fhd-chart__plot" role="img" aria-label={summary} style={{ height }}>
        <div className="fhd-chart__scale" aria-hidden="true">
          {scaled ? (
            <>
              <span style={{ bottom: '100%' }}>{text(top)}</span>
              <span style={{ bottom: '50%' }}>{text(top / 2)}</span>
            </>
          ) : null}
          <span style={{ bottom: 0 }}>{text(0)}</span>
        </div>
        <div className="fhd-chart__area" aria-hidden="true">
          <i className="fhd-chart__grid" style={{ bottom: '100%' }} />
          <i className="fhd-chart__grid" style={{ bottom: '50%' }} />
          {data.map((datum, index) => {
            const share = datum.value == null ? 0 : Math.max(0, Math.min(100, (datum.value / top) * 100));
            // The column's place in the row staggers the entrance; --share sets how far the bar and its value rise.
            const vars = { ['--fhd-i' as string]: index, ['--share' as string]: `${share}%` } as React.CSSProperties;
            return (
              <div key={datum.label + index} className={cx('fhd-chart__col', index === hi && 'fhd-chart__col--hi')} style={vars}>
                {datum.value == null ? (
                  <span className="fhd-chart__none">—</span>
                ) : (
                  <>
                    <div className="fhd-chart__track">
                      <div className="fhd-chart__bar" />
                    </div>
                    {showValues ? (
                      <div className="fhd-chart__lift">
                        <span className="fhd-chart__val">{text(datum.value)}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
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
