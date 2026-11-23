import 'server-only';
import { cookies } from 'next/headers';
import { isTimeZone, TIME_ZONE_COOKIE } from './format';

/** The admin's time zone, as their browser last reported it. UTC until it has. */
export async function adminTimeZone(): Promise<string> {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  let zone = '';
  try {
    zone = value ? decodeURIComponent(value) : '';
  } catch {
    // A garbled cookie falls back to UTC; the browser sends a good one on the next visit.
  }
  return isTimeZone(zone) ? zone : 'UTC';
}
