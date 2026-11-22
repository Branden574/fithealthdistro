import * as React from 'react';
import { Icon } from './Icon';
import { cx } from './util';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  /** Always give one. Hide it with `hideLabel` when the context already names the field (a search box). */
  label: React.ReactNode;
  /** Help text under the control. */
  hint?: React.ReactNode;
  /** Error text. Turns the edge to `danger` and is announced with the field. */
  error?: React.ReactNode;
  /** Short text or icon inside the control, before the value: "$". */
  prefix?: React.ReactNode;
  /** Short text inside the control, after the value: "lb", "units". */
  suffix?: React.ReactNode;
  /** Renders a textarea. */
  multiline?: boolean;
  /** Visible rows when `multiline`. */
  rows?: number;
  /** Keeps the label for screen readers only. */
  hideLabel?: boolean;
}

/** A labelled text input or textarea with hint and error. */
export function TextField(props: TextFieldProps) {
  const { label, hint, error, prefix, suffix, multiline, rows = 4, hideLabel, id, className, required, disabled, ...rest } = props;
  const auto = React.useId();
  const fieldId = id ?? auto;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const shared = {
    id: fieldId,
    className: 'fhd-field__input',
    required,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
  };
  return (
    <div className={cx('fhd-field', error ? 'fhd-field--error' : null, disabled && 'fhd-field--disabled', className)}>
      <label className={cx('fhd-field__label', hideLabel && 'fhd-sr')} htmlFor={fieldId}>
        {label}
        {required ? (
          <span className="fhd-field__req" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <div className={cx('fhd-field__control', multiline && 'fhd-field__control--multiline')}>
        {prefix != null ? <span className="fhd-field__affix">{prefix}</span> : null}
        {multiline ? (
          <textarea rows={rows} {...shared} {...(rest as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input {...shared} {...rest} />
        )}
        {suffix != null ? <span className="fhd-field__affix">{suffix}</span> : null}
      </div>
      {error ? (
        <p className="fhd-field__error" id={errorId}>
          <Icon name="warning-circle" size={16} />
          {error}
        </p>
      ) : null}
      {hint ? (
        <p className="fhd-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
