import * as React from 'react';
import { cx } from './util';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  /** A count shown in a pill after the label. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** The selected tab id. Leave it out, with `defaultValue`, to let Tabs keep its own state. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Names the tab list for screen readers: "Product views". */
  ariaLabel?: string;
  /**
   * The id of the element the tabs control. Give it `role="tabpanel"` and `aria-labelledby` set to the selected tab's id,
   * which is `${panelId}-tab-${item.id}`. Every tab points at it, so one panel can show each view in turn.
   */
  panelId?: string;
  className?: string;
}

function tabId(panelId: string, itemId: string): string {
  return `${panelId}-tab-${itemId}`;
}

/** Switches between views of one thing. The selected tab carries the heavy rule. */
export function Tabs(props: TabsProps) {
  const { items, value, defaultValue, onChange, ariaLabel, panelId, className } = props;
  const [inner, setInner] = React.useState(defaultValue ?? (items[0] ? items[0].id : ''));
  const current = value ?? inner;
  const select = (id: string) => {
    if (value === undefined) setInner(id);
    if (onChange) onChange(id);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
    const enabled = items.filter((item) => !item.disabled);
    if (!enabled.length) return;
    const at = enabled.findIndex((item) => item.id === current);
    const next =
      key === 'Home' ? 0 : key === 'End' ? enabled.length - 1 : (at + (key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    event.preventDefault();
    select(enabled[next].id);
    const buttons = event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])');
    if (buttons[next]) buttons[next].focus();
  };
  return (
    <div className={cx('fhd-tabs', className)} role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const selected = item.id === current;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={panelId ? tabId(panelId, item.id) : undefined}
            aria-controls={panelId}
            className="fhd-tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.id)}
          >
            {item.label}
            {item.count != null ? <span className="fhd-tab__count">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
