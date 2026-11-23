import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { rate } from './dashboard-math';
import { adminTimeZone } from './time';

/** One month of client retention, worked out on rolling three-month windows (see dashboard_stats in the database). */
export interface RetentionMonth {
  /** The month's first day: "2031-06-01". */
  month: string;
  /** "Jun". */
  short: string;
  /** "June 2031". */
  long: string;
  /** The three months the retention looks back on, and the three it looks at: "Jan to Mar", "Apr to Jun". */
  before: string;
  window: string;
  /** Clients active in the three months before. */
  previous: number;
  /** Of those, the ones active again in the window. */
  returned: number;
  /** Everyone active in the window, new clients included. */
  active: number;
  /** Whole percent, or null when nobody was active in the months before. */
  rate: number | null;
  /** The month in progress: its figure is so far. */
  current: boolean;
}

export interface SalesSlice {
  /** The slice's last day: "2031-06-05". */
  end: string;
  /** "6/5": short enough to sit under a bar on a phone. */
  label: string;
  /** "Jun 5", for reading out. */
  long: string;
  sales: number;
}

/** Sales and conversion over a number of days ending today, beside the same number of days before. */
export interface SalesPeriod {
  days: number;
  sales: number;
  orders: number;
  previousSales: number;
  previousOrders: number;
  /** Inquiries received in the period, and how many have an order on or after the day they came in. */
  inquiries: number;
  converted: number;
  previousInquiries: number;
  previousConverted: number;
  /** The period in six equal slices, oldest first. */
  slices: SalesSlice[];
  /** How many days each slice covers. */
  sliceDays: number;
}

export interface DashboardStats {
  today: string;
  months: RetentionMonth[];
  inquiries: { recent: number; previous: number; unread: number };
  products: { live: number; hidden: number };
  ordersRecorded: number;
  periods: SalesPeriod[];
}

const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayShort = new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', timeZone: 'UTC' });
const dayLong = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A calendar date as a moment at noon UTC, so formatting it in UTC never slips a day. */
const noon = (day: string) => new Date(`${day}T12:00:00Z`);

function monthsBefore(month: string, count: number): string {
  const date = noon(month);
  date.setUTCMonth(date.getUTCMonth() - count);
  return date.toISOString().slice(0, 10);
}

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);
const record = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const list = (value: unknown) => (Array.isArray(value) ? value : []);

/** Shapes the database's answer for the page, with labels written out. */
function toStats(raw: unknown): DashboardStats {
  const data = record(raw);
  const today = String(data.today ?? '');
  const thisMonth = `${today.slice(0, 7)}-01`;
  const months = list(data.months).map((entry): RetentionMonth => {
    const row = record(entry);
    const month = String(row.month);
    const previous = num(row.previous);
    const returned = num(row.returned);
    const range = (from: number, to: number) => `${monthShort.format(noon(monthsBefore(month, from)))} to ${monthShort.format(noon(monthsBefore(month, to)))}`;
    return {
      month,
      short: monthShort.format(noon(month)),
      long: monthLong.format(noon(month)),
      before: range(5, 3),
      window: range(2, 0),
      previous,
      returned,
      active: num(row.active),
      rate: rate(returned, previous),
      current: month === thisMonth,
    };
  });
  const inquiries = record(data.inquiries);
  const products = record(data.products);
  const periods = list(data.periods).map((entry): SalesPeriod => {
    const row = record(entry);
    const days = num(row.days);
    return {
      days,
      sales: num(row.sales),
      orders: num(row.orders),
      previousSales: num(row.previousSales),
      previousOrders: num(row.previousOrders),
      inquiries: num(row.inquiries),
      converted: num(row.converted),
      previousInquiries: num(row.previousInquiries),
      previousConverted: num(row.previousConverted),
      slices: list(row.slices).map((slice) => {
        const item = record(slice);
        const end = String(item.end);
        return { end, label: dayShort.format(noon(end)), long: dayLong.format(noon(end)), sales: num(item.sales) };
      }),
      sliceDays: Math.floor(days / 6),
    };
  });
  return {
    today,
    months,
    inquiries: { recent: num(inquiries.recent), previous: num(inquiries.previous), unread: num(inquiries.unread) },
    products: { live: num(products.live), hidden: num(products.hidden) },
    ordersRecorded: num(data.ordersRecorded),
    periods,
  };
}

/** Everything the dashboard and the retention page count, in the admin's time zone. Call `requireAdmin` first. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSessionClient();
  const zone = await adminTimeZone();
  const { data, error } = await supabase.rpc('dashboard_stats', { p_tz: zone });
  if (error) throw new Error(`Could not work out the dashboard: ${error.message}`);
  return toStats(data);
}
