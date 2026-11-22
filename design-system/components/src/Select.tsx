import * as React from 'react';
import { Icon } from './Icon';
import { cx } from './util';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: React.ReactNode;
  options: SelectOption[];
  /** Shown while nothing is chosen: "Choose a category". */
  placeholder?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Keeps the label for screen readers only. */
  hideLabel?: boolean;
}

/** A labelled native select, styled to match TextField. */
export function Select(props: SelectProps) {
  const { label, options, placeholder, hint, error, hideLabel, id, className, required, disabled, value, defaultValue, ...rest } = props;
  const auto = React.useId();
  const fieldId = id ?? auto;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const initial = value === undefined && defaultValue === undefined && placeholder ? '' : defaultValue;
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
      <div className="fhd-field__control">
        <select
          id={fieldId}
          className="fhd-field__input fhd-field__input--select"
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={initial}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="caret-down" size={16} className="fhd-field__caret" />
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
