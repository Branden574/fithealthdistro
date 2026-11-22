import * as React from 'react';
import { Button } from './Button';
import { cx } from './util';

export interface DialogProps {
  open: boolean;
  /** Called by the close button, the Escape key and a click on the scrim. */
  onClose: () => void;
  /** Says what is being decided: "Remove this product?". */
  title: string;
  /** One or two sentences under the title: what happens next. */
  description?: React.ReactNode;
  /** The body: a form, or nothing for a plain confirmation. */
  children?: React.ReactNode;
  /** Buttons, right-aligned. Cancel first, the action last. */
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Fills its nearest positioned ancestor instead of the viewport, and leaves focus alone. For embedding in docs. */
  contained?: boolean;
  /** Accessible name of the close button. */
  closeLabel?: string;
  className?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** A modal for one decision or one short form: confirm a removal, add a product. */
export function Dialog(props: DialogProps) {
  const { open, onClose, title, description, children, footer, size = 'md', contained, closeLabel = 'Close', className } = props;
  const panel = React.useRef<HTMLDivElement>(null);
  const close = React.useRef(onClose);
  close.current = onClose;
  const titleId = React.useId();
  // Stay mounted while the closing animation plays. Focus returns and input stops the moment `open` turns false.
  const [mounted, setMounted] = React.useState(open);
  const [closing, setClosing] = React.useState(false);
  if (open && !mounted) setMounted(true);
  if (open && closing) setClosing(false);
  if (!open && mounted && !closing) setClosing(true);
  const finish = React.useCallback(() => {
    setMounted(false);
    setClosing(false);
  }, []);

  React.useEffect(() => {
    if (!closing) return;
    // animationend is the normal path; this covers a browser that skips the animation.
    const timer = window.setTimeout(finish, 400);
    return () => window.clearTimeout(timer);
  }, [closing, finish]);

  React.useEffect(() => {
    if (!open || contained) return;
    // Keep the page behind still, without letting it jump sideways when the scrollbar goes.
    const root = document.documentElement;
    const gap = window.innerWidth - root.clientWidth;
    const before = { overflow: root.style.overflow, paddingRight: document.body.style.paddingRight };
    root.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      root.style.overflow = before.overflow;
      document.body.style.paddingRight = before.paddingRight;
    };
  }, [open, contained]);

  React.useEffect(() => {
    if (!open || contained) return;
    const previous = document.activeElement as HTMLElement | null;
    if (panel.current) panel.current.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close.current();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const stops = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!stops.length) {
        event.preventDefault();
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [open, contained]);

  if (!mounted) return null;
  return (
    <div
      className={cx('fhd-dialog', size !== 'md' && `fhd-dialog--${size}`, contained && 'fhd-dialog--contained', closing && 'fhd-dialog--closing', className)}
      inert={closing || undefined}
    >
      <div className="fhd-dialog__scrim" onClick={closing ? undefined : onClose} />
      <div
        ref={panel}
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) finish();
        }}
        className="fhd-dialog__panel"
        role="dialog"
        aria-modal={contained ? undefined : true}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="fhd-dialog__head">
          <div>
            <h2 className="fhd-dialog__title" id={titleId}>
              {title}
            </h2>
            {description ? <p className="fhd-dialog__desc">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" icon="x" aria-label={closeLabel} onClick={onClose} />
        </div>
        {children != null ? <div className="fhd-dialog__body">{children}</div> : null}
        {footer ? <div className="fhd-dialog__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
