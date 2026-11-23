import * as React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from './util';

export interface PhotoFieldProps {
  /** Names the photo: "Photo". */
  label: React.ReactNode;
  /** What to pick: "JPEG, PNG or WebP, up to 5 MB. Shown at 4:3." */
  hint?: React.ReactNode;
  /** What went wrong and how to fix it. Turns the frame's edge to `danger`. */
  error?: React.ReactNode;
  /** The photo shown now: the saved one, or the one just chosen. None shows an empty frame. */
  src?: string | null;
  /** Describes the photo for screen readers. Leave empty when the product's name is already beside it. */
  alt?: string;
  /** File types the picker offers: "image/jpeg,image/png,image/webp". */
  accept?: string;
  /** Called with the file the admin picked. Check its type and size here; the picker's filter is only a convenience. */
  onSelect: (file: File) => void;
  /** Shows a remove button while there is a photo. */
  onRemove?: () => void;
  /** While the photo uploads: the buttons wait and the frame says so. */
  busy?: boolean;
  /** The button with no photo yet. */
  chooseLabel?: string;
  /** The button once there is a photo. */
  replaceLabel?: string;
  removeLabel?: string;
  /** Said while `busy`. */
  busyLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Choose, replace or remove one photo, with a 4:3 preview in the same frame the catalog uses. */
export function PhotoField(props: PhotoFieldProps) {
  const {
    label,
    hint,
    error,
    src,
    alt = '',
    accept = 'image/jpeg,image/png,image/webp',
    onSelect,
    onRemove,
    busy = false,
    chooseLabel = 'Choose a photo',
    replaceLabel = 'Replace photo',
    removeLabel = 'Remove photo',
    busyLabel = 'Uploading',
    disabled = false,
    id,
    className,
  } = props;
  const auto = React.useId();
  const fieldId = id ?? auto;
  const labelId = `${fieldId}-label`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const input = React.useRef<HTMLInputElement>(null);
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={cx('fhd-field', 'fhd-photo', error ? 'fhd-photo--error' : null, disabled && 'fhd-field--disabled', className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span className="fhd-field__label" id={labelId}>
        {label}
      </span>
      <div className="fhd-photo__body">
        <div className="fhd-photo__frame" aria-busy={busy || undefined}>
          {src ? <img src={src} alt={alt} /> : <Icon name="image" size={32} />}
          {busy ? (
            <span className="fhd-photo__busy" role="status">
              {busyLabel}
            </span>
          ) : null}
        </div>
        <div className="fhd-photo__side">
          <div className="fhd-photo__actions">
            <Button
              size="sm"
              variant="outline"
              iconLeft="upload-simple"
              loading={busy}
              disabled={disabled || busy}
              aria-describedby={describedBy}
              onClick={() => input.current?.click()}
            >
              {src ? replaceLabel : chooseLabel}
            </Button>
            {src && onRemove ? (
              <Button size="sm" variant="ghost" iconLeft="trash" disabled={disabled || busy} onClick={onRemove}>
                {removeLabel}
              </Button>
            ) : null}
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
      </div>
      <input
        ref={input}
        id={fieldId}
        className="fhd-sr"
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Cleared at once, so choosing the same file again after an error still reports it.
          event.currentTarget.value = '';
          if (file) onSelect(file);
        }}
      />
    </div>
  );
}
