import * as React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { type IconName } from './icons';
import { cx } from './util';

export interface RequestListItem {
  id: string;
  /** The product name, sentence case. */
  name: string;
  /** Shown under the name: "Vending machines". */
  category?: string;
  /** The category glyph beside the name. */
  icon?: IconName;
}

export interface RequestListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The heading: "Your request". */
  title: string;
  /** How many products it holds, written out: "3 products in your request". Shown while it has items. */
  summary: string;
  items: RequestListItem[];
  /** Shown in place of the list while it is empty: what to press to add something. */
  empty: React.ReactNode;
  /** The remove button's visible label. Default "Remove". */
  removeLabel?: string;
  /** The remove button's accessible name for one item, starting with the visible label: "Remove Whey protein from your request". */
  removeAriaLabel?: (item: RequestListItem) => string;
  /** Called with the item's id when the client removes it. Focus moves to the next item, or to the heading once the list is empty. */
  onRemove?: (id: string) => void;
  /** The heading level that fits the page outline. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** The products a client has picked in the catalog, beside the contact form. Not a cart: there is nothing to pay. */
export function RequestList(props: RequestListProps) {
  const {
    title,
    summary,
    items,
    empty,
    removeLabel = 'Remove',
    removeAriaLabel,
    onRemove,
    headingLevel = 3,
    className,
    ...rest
  } = props;
  const Heading = `h${headingLevel}` as 'h3';
  const listRef = React.useRef<HTMLUListElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // The position of the item just removed, so focus can land on its neighbour once the list has updated.
  const removedAt = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    const index = removedAt.current;
    if (index == null) return;
    removedAt.current = null;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('.fhd-request__remove');
    const next = buttons && buttons.length ? buttons[Math.min(index, buttons.length - 1)] : headingRef.current;
    next?.focus();
  }, [items]);

  return (
    <div className={cx('fhd-request', className)} {...rest}>
      <div className="fhd-request__head">
        <Heading ref={headingRef} className="fhd-request__title" tabIndex={-1}>
          {title}
        </Heading>
        {items.length ? (
          // Keyed by its text, so the line plays its short entrance again each time the count changes.
          <p key={summary} className="fhd-request__summary">
            {summary}
          </p>
        ) : null}
      </div>
      {items.length ? (
        <ul ref={listRef} className="fhd-request__list">
          {items.map((item, index) => (
            <li key={item.id} className="fhd-request__item">
              {item.icon ? <Icon name={item.icon} size={20} className="fhd-request__icon" /> : null}
              <div className="fhd-request__text">
                <span className="fhd-request__name">{item.name}</span>
                {item.category ? <span className="fhd-request__category">{item.category}</span> : null}
              </div>
              {onRemove ? (
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft="x"
                  className="fhd-request__remove"
                  aria-label={removeAriaLabel ? removeAriaLabel(item) : undefined}
                  onClick={() => {
                    removedAt.current = index;
                    onRemove(item.id);
                  }}
                >
                  {removeLabel}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="fhd-request__empty">{empty}</p>
      )}
    </div>
  );
}
