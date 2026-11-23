import * as React from 'react';
import { cx } from './util';

export interface CountUpProps {
  /** The number to show. When it changes, the figure counts from what it showed to the new value. */
  value: number;
  /** Writes the number as text: "$12,480", "86". Defaults to whole numbers with thousands separators. */
  format?: (value: number) => string;
  className?: string;
}

const wholeNumber = (value: number) => Math.round(value).toLocaleString('en-US');

/** The enter duration from the tokens, so the count keeps time with the rest of the motion. */
function enterDuration(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue('--duration-enter').trim();
  const ms = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : NaN;
  return Number.isFinite(ms) ? ms : 360;
}

/**
 * A figure that counts to its new value when the value changes, so switching a period reads as movement. It shows the
 * value as it is on first render, so the page is readable at once, and under reduced motion every change is instant.
 * Screen readers get the final value only.
 */
export function CountUp({ value, format = wholeNumber, className }: CountUpProps) {
  const [shown, setShown] = React.useState(value);
  const current = React.useRef(value);

  React.useEffect(() => {
    const from = current.current;
    if (from === value) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduce ? 0 : enterDuration();
    if (duration <= 0) {
      current.current = value;
      setShown(value);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // Ease out: quick to start, settling on the value.
      const next = t >= 1 ? value : from + (value - from) * (1 - Math.pow(1 - t, 3));
      current.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // A newer value takes over from wherever this count had reached.
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={cx('fhd-count', className)}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="fhd-sr">{format(value)}</span>
    </span>
  );
}
