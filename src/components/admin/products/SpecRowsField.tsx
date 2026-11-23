'use client';

import { Button, TextField } from '@ds';
import { useId, useRef, useState } from 'react';
import { PRODUCT_LIMITS, type SpecRow } from '@/lib/admin/product-form';

interface Row extends SpecRow {
  key: number;
}

interface SpecRowsFieldProps {
  initial: SpecRow[];
  /** The form-level message for the rows. */
  error?: string;
  /** Per row, in order. */
  rowErrors?: Array<{ label?: string; value?: string } | null>;
}

/**
 * The spec rows on a product's page: a label and a value each ("Selections", "40"). Rows can be added, removed and moved;
 * every control is a real button, so the keyboard does all of it. The inputs post as matching `spec_label`/`spec_value`.
 */
export function SpecRowsField({ initial, error, rowErrors }: SpecRowsFieldProps) {
  const next = useRef(initial.length);
  const [rows, setRows] = useState<Row[]>(() => initial.map((row, index) => ({ ...row, key: index })));
  const list = useRef<HTMLOListElement>(null);
  const hintId = useId();
  const full = rows.length >= PRODUCT_LIMITS.specRows;

  function focusRow(index: number, part: 'label' | 'move-up' | 'move-down' = 'label') {
    // After the change has rendered.
    requestAnimationFrame(() => {
      const item = list.current?.children[index] as HTMLElement | undefined;
      const target =
        part === 'label' ? item?.querySelector<HTMLElement>('input') : item?.querySelector<HTMLElement>(`[data-move="${part}"]:not([disabled])`);
      (target ?? item?.querySelector<HTMLElement>('input'))?.focus();
    });
  }

  function add() {
    if (full) return;
    setRows((now) => [...now, { label: '', value: '', key: next.current++ }]);
    focusRow(rows.length);
  }

  function remove(index: number) {
    setRows((now) => now.filter((_, at) => at !== index));
    if (rows.length > 1) focusRow(Math.min(index, rows.length - 2));
  }

  function move(index: number, by: -1 | 1) {
    const to = index + by;
    if (to < 0 || to >= rows.length) return;
    setRows((now) => {
      const copy = [...now];
      [copy[index], copy[to]] = [copy[to], copy[index]];
      return copy;
    });
    focusRow(to, by < 0 ? 'move-up' : 'move-down');
  }

  function edit(index: number, part: 'label' | 'value', value: string) {
    setRows((now) => now.map((row, at) => (at === index ? { ...row, [part]: value } : row)));
  }

  return (
    <fieldset className="spec-rows" aria-describedby={hintId}>
      <legend className="fhd-field__label">Specifications</legend>
      <p className="fhd-field__hint" id={hintId}>
        A label and a value per row, such as Selections and 40. Shown as a list on the product&apos;s page.
      </p>
      {error ? (
        <p className="fhd-field__error" role="alert">
          {error}
        </p>
      ) : null}
      {rows.length ? (
        <ol className="spec-rows__list" ref={list}>
          {rows.map((row, index) => {
            const problem = rowErrors?.[index] ?? undefined;
            const n = index + 1;
            return (
              <li key={row.key} className="spec-row">
                <TextField
                  name="spec_label"
                  label={`Label ${n}`}
                  hideLabel
                  placeholder="Label"
                  maxLength={PRODUCT_LIMITS.specLabel}
                  value={row.label}
                  onChange={(event) => edit(index, 'label', event.currentTarget.value)}
                  error={problem?.label}
                />
                <TextField
                  name="spec_value"
                  label={`Value ${n}`}
                  hideLabel
                  placeholder="Value"
                  maxLength={PRODUCT_LIMITS.specValue}
                  value={row.value}
                  onChange={(event) => edit(index, 'value', event.currentTarget.value)}
                  error={problem?.value}
                />
                <div className="spec-row__tools">
                  <Button size="sm" variant="ghost" icon="caret-up" aria-label={`Move row ${n} up`} data-move="move-up" disabled={index === 0} onClick={() => move(index, -1)} />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="caret-down"
                    aria-label={`Move row ${n} down`}
                    data-move="move-down"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  <Button size="sm" variant="ghost" icon="trash" aria-label={`Remove row ${n}`} onClick={() => remove(index)} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
      <div>
        <Button size="sm" variant="outline" iconLeft="plus" onClick={add} disabled={full}>
          {full ? `${PRODUCT_LIMITS.specRows} rows is the most` : 'Add a row'}
        </Button>
      </div>
    </fieldset>
  );
}
