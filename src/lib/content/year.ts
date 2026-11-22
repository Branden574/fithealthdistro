import 'server-only';
import { cacheLife } from 'next/cache';

/** The current year for the copyright line. Cached and refreshed daily, so pages can still be prerendered. */
export async function currentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}
