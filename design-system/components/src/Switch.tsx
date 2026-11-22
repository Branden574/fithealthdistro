import * as React from 'react';
import { cx } from './util';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  /** Names the setting: "Show in catalog". Without it, pass `aria-label`. */
  label?: React.ReactNode;
  /** A quieter second line that says what turning it on does. */
  hint?: React.ReactNode;
}

/** An on/off setting that takes effect at once, such as showing a product in the catalog. */
export function Switch(props: SwitchProps) {
  const { label, hint, className, ...rest } = props;
  return (
    <label className={cx('fhd-switch', className)}>
      <input type="checkbox" role="switch" className="fhd-switch__input" {...rest} />
      <span className="fhd-switch__track" aria-hidden="true">
        <span className="fhd-switch__thumb" />
      </span>
      {label != null ? (
        <span className="fhd-switch__text">
          <span>{label}</span>
          {hint ? <span className="fhd-switch__hint">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
