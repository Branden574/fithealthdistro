import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { TextField } from './TextField';
import { cx } from './util';

export interface ContentFieldProps {
  /** What this text is: "Headline", "Main button". */
  label: string;
  /** Where it shows on the site, as an eyebrow: "Home · Hero". */
  location?: string;
  /** The text as it stands in the editor. */
  value: string;
  onChange: (value: string) => void;
  /** The text the site shipped with. Shown under the field once it differs, and what Restore original puts back. */
  original: string;
  /** The text clients see right now. When `value` differs from it the field is marked Unpublished. */
  published?: string;
  /** A paragraph rather than a line. */
  multiline?: boolean;
  /** Visible rows when `multiline`. */
  rows?: number;
  /** The longest the text can be before it breaks the layout. Shows a counter and an error past it; typing is not blocked. */
  maxLength?: number;
  /** How the text is used: "One word of it takes the highlighter." */
  hint?: React.ReactNode;
  /** Overrides the built-in too-long message, or reports another problem such as an empty field. */
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** One piece of website text in the admin's Site content page: edit it, see that it changed, put the original back. */
export function ContentField(props: ContentFieldProps) {
  const { label, location, value, onChange, original, published, multiline, rows = 3, maxLength, hint, error, disabled, className } = props;
  const edited = value !== original;
  const unpublished = published !== undefined && value !== published;
  const over = maxLength != null && value.length > maxLength;
  const problem = error ?? (over ? `Shorten this to ${maxLength} characters or fewer.` : undefined);
  return (
    <div className={cx('fhd-content', className)}>
      <div className="fhd-content__head">
        <span className="fhd-content__location">{location}</span>
        {unpublished ? (
          <Badge tone="warning" dot>
            Unpublished
          </Badge>
        ) : edited ? (
          <Badge>Edited</Badge>
        ) : null}
      </div>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        multiline={multiline}
        rows={rows}
        hint={hint}
        error={problem}
        disabled={disabled}
      />
      <div className="fhd-content__foot">
        {maxLength != null ? (
          <span className={cx('fhd-content__count', over && 'fhd-content__count--over')}>
            {value.length} / {maxLength}
          </span>
        ) : null}
        {edited ? (
          <>
            <span className="fhd-content__original">
              Original: <q>{original}</q>
            </span>
            <Button size="sm" variant="ghost" iconLeft="arrows-clockwise" disabled={disabled} onClick={() => onChange(original)}>
              Restore original
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
