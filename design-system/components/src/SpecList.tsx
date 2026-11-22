import * as React from 'react';
import { cx } from './util';

export interface SpecItem {
  /** What is measured, sentence case: "Selections", "Power". */
  label: string;
  /** The figure with its unit: "40", "115 V", "72 x 39 x 35 in". */
  value: string;
}

export interface SpecListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: SpecItem[];
}

/** A product's specifications on its page: one row per spec, label beside value, under a heavy rule. */
export function SpecList(props: SpecListProps) {
  const { items, className, ...rest } = props;
  if (!items.length) return null;
  return (
    <dl className={cx('fhd-specs', className)} {...rest}>
      {items.map((item, index) => (
        <div key={`${index}-${item.label}`} className="fhd-specs__row">
          <dt className="fhd-specs__label">{item.label}</dt>
          <dd className="fhd-specs__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
