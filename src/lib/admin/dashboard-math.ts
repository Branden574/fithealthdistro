/**
 * Rates and changes for the dashboard. Plain arithmetic, shared by the server and the page, so a figure and its change
 * are always worked out the same way.
 */

export interface Change {
  /** Written out: "+4 pts", "-3", "+18%", "No change". */
  label: string;
  direction: 'up' | 'down' | 'flat';
}

/** A share as a whole percent, or null when there is nothing to take a share of. */
export function rate(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

function signed(value: number, suffix: string): Change {
  if (value === 0) return { label: 'No change', direction: 'flat' };
  return { label: `${value > 0 ? '+' : '−'}${Math.abs(value).toLocaleString('en-US')}${suffix}`, direction: value > 0 ? 'up' : 'down' };
}

/** The change between two counts: "+3". */
export function countChange(now: number, before: number): Change {
  return signed(now - before, '');
}

/** The change between two percentages, in points: "+4 pts". None when either has no figure. */
export function pointsChange(now: number | null, before: number | null): Change | undefined {
  return now == null || before == null ? undefined : signed(now - before, ' pts');
}

/** The change between two amounts as a share of the earlier one: "+18%". None when there was nothing before. */
export function percentChange(now: number, before: number): Change | undefined {
  if (before <= 0) return undefined;
  return signed(Math.round(((now - before) / before) * 100), '%');
}
