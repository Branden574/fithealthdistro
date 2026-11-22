import * as React from 'react';
import { Icon } from './Icon';
import { cx } from './util';

export interface CheckboxGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
  /** Names the group, like a field label: "I am interested in". */
  legend: React.ReactNode;
  /** Help under the legend: "Tick everything that applies." */
  hint?: React.ReactNode;
  /** Error text under the boxes: "Tick at least one." Announced with the group. */
  error?: React.ReactNode;
  /** Marks the group with the required asterisk. At least one box has to be ticked; say so in `hint` or `error`. */
  required?: boolean;
  /** Keeps the legend for screen readers only, for a nested group whose parent box already names it. */
  hideLegend?: boolean;
  /** Indents the group under the box that opened it, with a hairline: the products of a ticked category. */
  nested?: boolean;
  /** Checkboxes, and nested groups. */
  children: React.ReactNode;
}

/** Several boxes answering one question, any number of them ticked. A real fieldset, so the question is read with each box. */
export function CheckboxGroup(props: CheckboxGroupProps) {
  const { legend, hint, error, required, hideLegend, nested, className, children, id, ...rest } = props;
  const auto = React.useId();
  const groupId = id ?? auto;
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  return (
    <fieldset
      id={groupId}
      className={cx('fhd-checkgroup', nested && 'fhd-checkgroup--nested', error ? 'fhd-checkgroup--error' : null, className)}
      aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
      {...rest}
    >
      <legend className={cx('fhd-checkgroup__legend', hideLegend && 'fhd-sr')}>
        {legend}
        {required ? (
          <span className="fhd-field__req" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </legend>
      {hint ? (
        <p className="fhd-field__hint fhd-checkgroup__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="fhd-checkgroup__options">{children}</div>
      {error ? (
        <p className="fhd-field__error" id={errorId}>
          <Icon name="warning-circle" size={16} />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
