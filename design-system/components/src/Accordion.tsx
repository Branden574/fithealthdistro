import * as React from 'react';
import { Icon } from './Icon';
import { cx } from './util';

export interface AccordionItem {
  id: string;
  /** The question, sentence case. It is the button's label. */
  title: React.ReactNode;
  /** The answer. Pass paragraphs as <p> elements; they are spaced for you. */
  content: React.ReactNode;
}

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: AccordionItem[];
  /** Ids open at first. Leave `open` out to let the accordion keep its own state. */
  defaultOpen?: string[];
  /** Ids open now, for a controlled accordion. */
  open?: string[];
  /** Called with every id that is open after a question is pressed. */
  onOpenChange?: (open: string[]) => void;
  /** The heading level of each question, to fit the page outline. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

const noop = () => () => {};
/** False on the server and while hydrating, true once the accordion runs in the browser. */
function useInBrowser(): boolean {
  return React.useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Questions that open to show their answers: the FAQ. Any number can be open at once, so visitors can compare.
 * Each question is a real button with aria-expanded, tied to its answer. Until the accordion runs in the browser,
 * every answer shows, so the text never depends on a script loading.
 */
export function Accordion(props: AccordionProps) {
  const { items, defaultOpen, open, onOpenChange, headingLevel = 3, className, ...rest } = props;
  const [inner, setInner] = React.useState<string[]>(defaultOpen ?? []);
  const current = open ?? inner;
  const ready = useInBrowser();
  const root = React.useRef<HTMLDivElement>(null);
  const baseId = React.useId();

  // Collapse without animating once the browser takes over, then turn animation on for the visitor's own presses.
  React.useEffect(() => {
    if (!ready || !root.current) return;
    const node = root.current;
    // Reading layout applies the collapsed state now, before transitions exist, so hydrating never plays a close.
    void node.offsetHeight;
    node.setAttribute('data-animate', '');
  }, [ready]);

  const toggle = (id: string) => {
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    if (open === undefined) setInner(next);
    if (onOpenChange) onOpenChange(next);
  };

  // Up and Down move between questions; Home and End jump to the first and last.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (rest.onKeyDown) rest.onKeyDown(event);
    const key = event.key;
    if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return;
    const triggers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.fhd-accordion__trigger'));
    const at = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    event.preventDefault();
    const next = key === 'Home' ? 0 : key === 'End' ? triggers.length - 1 : (at + (key === 'ArrowDown' ? 1 : -1) + triggers.length) % triggers.length;
    triggers[next].focus();
  };

  const Heading = `h${headingLevel}` as 'h3';
  // A region landmark per answer helps with a few; with many it crowds the landmark list.
  const asRegion = items.length <= 6;
  return (
    <div ref={root} className={cx('fhd-accordion', className)} data-ready={ready ? '' : undefined} {...rest} onKeyDown={onKeyDown}>
      {items.map((item, index) => {
        const isOpen = current.includes(item.id);
        const triggerId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;
        return (
          <div key={item.id} className="fhd-accordion__item" data-state={isOpen ? 'open' : 'closed'}>
            <Heading className="fhd-accordion__heading">
              <button
                type="button"
                id={triggerId}
                className="fhd-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span className="fhd-accordion__title">{item.title}</span>
                <span className="fhd-accordion__mark" aria-hidden="true">
                  <Icon name="caret-down" size={16} />
                </span>
              </button>
            </Heading>
            <div
              id={panelId}
              className="fhd-accordion__panel"
              role={asRegion ? 'region' : undefined}
              aria-labelledby={triggerId}
              inert={ready && !isOpen ? true : undefined}
            >
              <div className="fhd-accordion__clip">
                <div className="fhd-accordion__content">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
