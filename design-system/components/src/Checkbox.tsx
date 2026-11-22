import * as React from 'react';
import { Icon } from './Icon';
import { cx } from './util';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Text beside the box. Without it, pass `aria-label`. */
  label?: React.ReactNode;
  /** A quieter second line under the label. */
  hint?: React.ReactNode;
  /** Some, not all: the select-all box of a table with a partial selection. */
  indeterminate?: boolean;
}

/** A checkbox. Checked is a volt fill with an ink tick. */
export function Checkbox(props: CheckboxProps) {
  const { label, hint, indeterminate = false, className, ...rest } = props;
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('fhd-check', className)}>
      <input ref={ref} type="checkbox" className="fhd-check__input" {...rest} />
      <span className="fhd-check__box" aria-hidden="true">
        <Icon name={indeterminate ? 'minus' : 'check'} size={14} />
      </span>
      {label != null ? (
        <span className="fhd-check__text">
          <span>{label}</span>
          {hint ? <span className="fhd-check__hint">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
