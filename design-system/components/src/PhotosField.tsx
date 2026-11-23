import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from './util';

export interface PhotosFieldPhoto {
  /** Stays the same while the photo moves: its storage path. */
  key: string;
  src: string;
}

export interface PhotosFieldProps {
  /** Names the photos: "Photos". */
  label: React.ReactNode;
  /** What to pick: "JPEG, PNG or WebP, up to 5 MB each. Cropped to 4:3." */
  hint?: React.ReactNode;
  /** What went wrong and how to fix it. Turns the add button's edge to `danger`. */
  error?: React.ReactNode;
  /** In order; the first is the cover. */
  photos: PhotosFieldPhoto[];
  /** How many it takes. The add button goes once there are this many. */
  max: number;
  /** Called with the files the admin picked, in the picker's order, at most as many as there is room for. */
  onSelect: (files: File[]) => void;
  /** Moves the photo at `from` to `to`. */
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  /** While photos upload: the add button waits and says `busyLabel`. Moving and removing still work. */
  busy?: boolean;
  /** File types the picker offers. */
  accept?: string;
  addLabel?: string;
  busyLabel?: string;
  /** On the first photo. */
  coverLabel?: string;
  /** "3 of 8 photos". */
  countLabel?: (count: number, max: number) => string;
  /** Names a photo for its buttons: "Photo 2". */
  photoLabel?: (number: number) => string;
  earlierLabel?: string;
  laterLabel?: string;
  removeLabel?: string;
  /** Said after a move: "Photo moved to 1 of 4". */
  movedLabel?: (position: number, count: number) => string;
  /** Said after a removal. */
  removedLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

type Action = 'earlier' | 'later' | 'remove';

/**
 * Several photos in the order clients see them. The first is the cover. Each can move earlier or later or be removed,
 * and the add button takes several files at once. Moving keeps the focus on the photo that moved.
 */
export function PhotosField(props: PhotosFieldProps) {
  const {
    label,
    hint,
    error,
    photos,
    max,
    onSelect,
    onMove,
    onRemove,
    busy = false,
    accept = 'image/jpeg,image/png,image/webp',
    addLabel = 'Add photos',
    busyLabel = 'Uploading',
    coverLabel = 'Cover',
    countLabel = (count, most) => `${count} of ${most} photos`,
    photoLabel = (number) => `Photo ${number}`,
    earlierLabel = 'Move earlier',
    laterLabel = 'Move later',
    removeLabel = 'Remove',
    movedLabel = (position, count) => `Photo moved to ${position} of ${count}`,
    removedLabel = 'Photo removed',
    disabled = false,
    id,
    className,
  } = props;
  const auto = React.useId();
  const fieldId = id ?? auto;
  const labelId = `${fieldId}-label`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const countId = `${fieldId}-count`;
  const input = React.useRef<HTMLInputElement>(null);
  const list = React.useRef<HTMLOListElement>(null);
  const add = React.useRef<HTMLDivElement>(null);
  const root = React.useRef<HTMLDivElement>(null);
  // Where the focus goes once the list has changed: a photo's button, or the add button.
  const focus = React.useRef<{ key: string | null; action: Action } | null>(null);
  // Each change gets a new number, so the same sentence twice in a row (two removals) is still read out.
  const [said, setSaid] = React.useState({ text: '', n: 0 });
  const count = photos.length;
  const room = Math.max(0, max - count);
  const describedBy = [errorId, countId, hintId].filter(Boolean).join(' ') || undefined;

  React.useLayoutEffect(() => {
    const want = focus.current;
    if (!want) return;
    focus.current = null;
    // A photo moved to either end loses that direction's button, so the focus falls back to its remove button.
    const item = want.key ? list.current?.querySelector<HTMLElement>(`[data-photo="${CSS.escape(want.key)}"]`) : null;
    const target = item
      ? (item.querySelector<HTMLElement>(`[data-action="${want.action}"]:not(:disabled)`) ?? item.querySelector<HTMLElement>('[data-action="remove"]'))
      : (add.current?.querySelector<HTMLElement>('button:not(:disabled)') ?? root.current);
    // With the last photo gone during an upload the add button is waiting, so the field itself takes the focus.
    target?.focus();
  }, [photos]);

  function move(from: number, to: number, action: Action) {
    const photo = photos[from];
    if (!photo || to < 0 || to >= count) return;
    onMove(from, to);
    focus.current = { key: photo.key, action };
    setSaid((last) => ({ text: movedLabel(to + 1, count), n: last.n + 1 }));
  }

  function remove(index: number) {
    // The next photo takes its place; after the last one, the one before it; with none left, the add button.
    const next = photos[index + 1] ?? photos[index - 1];
    onRemove(index);
    focus.current = { key: next?.key ?? null, action: 'remove' };
    setSaid((last) => ({ text: removedLabel, n: last.n + 1 }));
  }

  return (
    <div
      ref={root}
      className={cx('fhd-field', 'fhd-photos', error ? 'fhd-photos--error' : null, disabled && 'fhd-field--disabled', className)}
      role="group"
      aria-labelledby={labelId}
      tabIndex={-1}
    >
      <span className="fhd-field__label" id={labelId}>
        {label}
      </span>
      {count ? (
        <ol ref={list} className="fhd-photos__list">
          {photos.map((photo, index) => {
            const name = photoLabel(index + 1);
            return (
              <li key={photo.key} className="fhd-photos__item" data-photo={photo.key}>
                <div className="fhd-photos__frame">
                  <img src={photo.src} alt="" draggable={false} />
                  {index === 0 ? (
                    <Badge className="fhd-photos__cover" tone="solid">
                      {coverLabel}
                    </Badge>
                  ) : null}
                </div>
                <div className="fhd-photos__tools" role="group" aria-label={name}>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="caret-left"
                    aria-label={`${earlierLabel}, ${name}`}
                    data-action="earlier"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1, 'earlier')}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="caret-right"
                    aria-label={`${laterLabel}, ${name}`}
                    data-action="later"
                    disabled={disabled || index === count - 1}
                    onClick={() => move(index, index + 1, 'later')}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    aria-label={`${removeLabel}, ${name}`}
                    data-action="remove"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
      <div ref={add} className="fhd-photos__add">
        {room ? (
          <Button
            size="sm"
            variant="outline"
            iconLeft="upload-simple"
            loading={busy}
            disabled={disabled || busy}
            aria-describedby={describedBy}
            onClick={() => input.current?.click()}
          >
            {busy ? busyLabel : addLabel}
          </Button>
        ) : null}
        <span className="fhd-photos__count caption" id={countId}>
          {countLabel(count, max)}
        </span>
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
      <p className="fhd-sr" aria-live="polite">
        {said.text ? <span key={said.n}>{said.text}</span> : null}
      </p>
      <input
        ref={input}
        id={fieldId}
        className="fhd-sr"
        type="file"
        accept={accept}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled || busy || !room}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []).slice(0, room);
          // Cleared at once, so picking the same files again after an error still reports them.
          event.currentTarget.value = '';
          if (files.length) onSelect(files);
        }}
      />
    </div>
  );
}
