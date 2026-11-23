/** Dollars as the admin reads them. Orders are in US dollars; the site takes no payments. */

const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** "$1,250" or "$1,250.50": cents only when there are some. For a single order. */
export function formatDollars(amount: number): string {
  return Number.isInteger(amount) ? whole.format(amount) : cents.format(amount);
}

/** "$12,480": rounded to the dollar, for totals and averages on the dashboard. */
export function formatWholeDollars(amount: number): string {
  return whole.format(Math.round(amount));
}
