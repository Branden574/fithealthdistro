import * as React from 'react';
import { Button } from './Button';
import { cx } from './util';

export interface GalleryPhoto {
  src: string;
  /** Describes the photo. Leave empty when the page's heading already says what it shows. */
  alt?: string;
}

export interface GalleryProps {
  /** In order; the first shows first. None shows `placeholder`. */
  photos: GalleryPhoto[];
  /** Names the carousel for screen readers: "Photos of Combo vending machine". */
  label: string;
  /** Shown in the frame when there are no photos: the category's glyph. */
  placeholder?: React.ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  /**
   * Names one photo, for its slide, its thumbnail and the announcement when it comes into view. `{number}` and `{total}`
   * are filled in. A string, not a function, so a server component can pass it.
   */
  photoLabel?: string;
  /** Greys the photos, for a product that is out of stock. */
  dimmed?: boolean;
  className?: string;
}

function nameOf(template: string, number: number, total: number): string {
  return template.replace(/\{number\}/g, String(number)).replace(/\{total\}/g, String(total));
}

/**
 * A product's photos, one at a time in a 4:3 frame, with thumbnails under it. Swipe, scroll, the arrow buttons or the
 * arrow keys move between them; it never moves by itself. Under reduced motion the frame jumps instead of gliding.
 */
export function Gallery(props: GalleryProps) {
  const {
    photos,
    label,
    placeholder,
    previousLabel = 'Previous photo',
    nextLabel = 'Next photo',
    photoLabel = 'Photo {number} of {total}',
    dimmed = false,
    className,
  } = props;
  const track = React.useRef<HTMLDivElement>(null);
  const [current, setCurrent] = React.useState(0);
  // Nothing is announced until the visitor moves the gallery.
  const [moved, setMoved] = React.useState(false);
  const count = photos.length;
  const several = count > 1;

  // Set while the buttons, keys or thumbnails glide the track to a slide. Until it arrives, the slides it passes do not
  // count as the current one, so the counter and the announcement never flick back and a quick second press moves on.
  const target = React.useRef<number | null>(null);
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The slide in view, from the track's scroll position: swipes and scrolls end up here.
  React.useEffect(() => {
    const element = track.current;
    if (!element || !several) return;
    let frame = 0;
    const read = () => {
      const width = element.clientWidth || 1;
      setCurrent(Math.max(0, Math.min(count - 1, Math.round(element.scrollLeft / width))));
    };
    const arrive = () => {
      clearTimeout(settle.current);
      target.current = null;
      read();
    };
    const onScroll = () => {
      if (target.current != null) {
        // Browsers without scrollend: the glide is over once the scroll events stop.
        clearTimeout(settle.current);
        settle.current = setTimeout(arrive, 150);
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    const onScrollEnd = () => {
      if (target.current != null) arrive();
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('scrollend', onScrollEnd);
    return () => {
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('scrollend', onScrollEnd);
      cancelAnimationFrame(frame);
      clearTimeout(settle.current);
    };
  }, [count, several]);

  function show(index: number) {
    const element = track.current;
    if (!element || !several) return;
    // Past either end it comes round again, so the button under the pointer or the focus never goes dead.
    const next = (index + count) % count;
    const instant = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.current = next;
    // Released by the scroll's end, or soon if the track was already there and never scrolls.
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      target.current = null;
    }, 1000);
    element.scrollTo({ left: next * element.clientWidth, behavior: instant ? 'auto' : 'smooth' });
    setCurrent(next);
    setMoved(true);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!several) return;
    const to =
      event.key === 'ArrowRight' ? current + 1 : event.key === 'ArrowLeft' ? current - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
    if (to == null) return;
    event.preventDefault();
    show(to);
  }

  if (!count) {
    return (
      <div className={cx('fhd-gallery', className)}>
        <div className="fhd-gallery__stage fhd-gallery__stage--empty">{placeholder}</div>
      </div>
    );
  }

  return (
    <section className={cx('fhd-gallery', dimmed && 'fhd-gallery--dimmed', className)} aria-roledescription="carousel" aria-label={label}>
      <div className="fhd-gallery__stage">
        <div
          ref={track}
          className="fhd-gallery__track"
          // Focusable so a keyboard can move it; a single photo has nothing to move.
          tabIndex={several ? 0 : undefined}
          role={several ? 'group' : undefined}
          aria-label={several ? label : undefined}
          onKeyDown={onKeyDown}
          onScroll={() => setMoved(true)}
        >
          {photos.map((photo, index) => (
            <div
              key={`${photo.src}-${index}`}
              className="fhd-gallery__slide"
              role={several ? 'group' : undefined}
              aria-roledescription={several ? 'slide' : undefined}
              aria-label={several ? nameOf(photoLabel, index + 1, count) : undefined}
            >
              <img src={photo.src} alt={photo.alt ?? ''} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
            </div>
          ))}
        </div>
        {several ? (
          <>
            <Button className="fhd-gallery__nav fhd-gallery__nav--previous" variant="solid" icon="caret-left" aria-label={previousLabel} onClick={() => show(current - 1)} />
            <Button className="fhd-gallery__nav fhd-gallery__nav--next" variant="solid" icon="caret-right" aria-label={nextLabel} onClick={() => show(current + 1)} />
            <span className="fhd-gallery__count" aria-hidden="true">
              {current + 1} / {count}
            </span>
          </>
        ) : null}
      </div>
      {several ? (
        <>
          <ul className="fhd-gallery__thumbs">
            {photos.map((photo, index) => (
              <li key={`${photo.src}-${index}`}>
                <button
                  type="button"
                  className="fhd-gallery__thumb"
                  aria-label={nameOf(photoLabel, index + 1, count)}
                  aria-current={index === current ? 'true' : undefined}
                  onClick={() => show(index)}
                >
                  <img src={photo.src} alt="" loading="lazy" decoding="async" draggable={false} />
                </button>
              </li>
            ))}
          </ul>
          <p className="fhd-sr" aria-live="polite">
            {moved ? nameOf(photoLabel, current + 1, count) : ''}
          </p>
        </>
      ) : null}
    </section>
  );
}
