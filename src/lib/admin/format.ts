/**
 * Dates in the admin, in the admin's own time zone. The browser reports its zone once in a cookie (TimeZoneSync), and the
 * server formats with it, so times read the same on the page as on the admin's clock.
 */

export const TIME_ZONE_COOKIE = 'fhd_tz';

/** Is this a time zone Intl understands, such as "America/Chicago"? */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** "2026-11-22": the calendar day a moment falls on in `zone`. */
export function dayIn(date: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** "2026-11-21" for "2026-11-22": the calendar day before, counted in days, so a 23- or 25-hour day changes nothing. */
export function dayBefore(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date - 1)).toISOString().slice(0, 10);
}

/** "Today, 9:41 AM", "Yesterday, 4:02 PM", "Nov 20, 9:41 AM", or "Nov 20, 2025, 9:41 AM" in another year. */
export function formatWhen(iso: string, zone: string, now: Date): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(date);
  const day = dayIn(date, zone);
  const today = dayIn(now, zone);
  if (day === today) return `Today, ${time}`;
  if (day === dayBefore(today)) return `Yesterday, ${time}`;
  return `${formatDay(iso, zone, now)}, ${time}`;
}

/** "Nov 20", or "Nov 20, 2025" in another year. */
export function formatDay(iso: string, zone: string, now: Date): string {
  const date = new Date(iso);
  const sameYear = dayIn(date, zone).slice(0, 4) === dayIn(now, zone).slice(0, 4);
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) }).format(date);
}

/** Noon on a calendar day in `zone`, as a moment: where a day picked in a form is filed. Noon keeps clear of clock changes. */
export function noonOn(day: string, zone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, date, 12);
  // How far the zone's clock is from UTC at that moment.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const shown = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(guess - (shown - guess));
}
