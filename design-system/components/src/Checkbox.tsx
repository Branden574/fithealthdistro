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
  /** Error text under the box: a required agreement that was left empty. Announced with the box. */
  error?: React.ReactNode;
}

/** A checkbox. Checked is a volt fill with an ink tick. */
export function Checkbox(props: CheckboxProps) {
  const { label, hint, error, indeterminate = false, className, id, ...rest } = props;
  const ref = React.useRef<HTMLInputElement>(null);
  const auto = React.useId();
  const fieldId = id ?? auto;
  const errorId = error ? `${fieldId}-error` : undefined;
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const box = (
    <label className={cx('fhd-check', error ? 'fhd-check--error' : null, error ? null : className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className="fhd-check__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...rest}
      />
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
  if (!error) return box;
  return (
    <div className={cx('fhd-check-field', className)}>
      {box}
      <p className="fhd-field__error" id={errorId}>
        <Icon name="warning-circle" size={16} />
        {error}
      </p>
    </div>
  );
}
