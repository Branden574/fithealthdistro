import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createSessionClient } from '@/lib/supabase/server';
import { channelOf } from './channels';
import { toCsv, type Cell } from './csv';
import { dayIn } from './format';
import { adminTimeZone } from './time';

/**
 * The admin's downloads: every inquiry, every client, every order and the marketing list, as spreadsheet files. Read as
 * the admin, so the database's own rules apply as they do on the pages. Call `getAdmin` first.
 */
export const EXPORT_KINDS = ['inquiries', 'clients', 'orders', 'marketing'] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export const isExportKind = (value: string): value is ExportKind => (EXPORT_KINDS as readonly string[]).includes(value);

type Client = SupabaseClient<Database>;
type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** PostgREST answers at most this many rows at a time. */
const PAGE = 1000;
/** Far past anything this business will hold; it stops a runaway read rather than limiting a real one. */
const MAX_ROWS = 100_000;

/** Every row, a page at a time. The query must have a stable order. */
async function all<T>(read: (from: number, to: number) => Page<T>, what: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await read(from, from + PAGE - 1);
    if (error) throw new Error(`Could not read ${what}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
  throw new Error(`Could not read ${what}: more than ${MAX_ROWS} rows`);
}

/** "2026-11-22 14:05" in the admin's time zone, which the column header names. Empty when there is no time. */
function stamp(iso: string | null, zone: string): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

const money = (value: number | string | null) => (value == null ? null : Math.round(Number(value) * 100) / 100);

interface Sheet {
  headers: string[];
  rows: Cell[][];
}

async function inquiries(supabase: Client, zone: string): Promise<Sheet> {
  const rows = await all(
    (from, to) =>
      supabase
        .from('inquiries')
        .select(
          'id, created_at, status, name, company, email, phone, interest, message, read_at, replied_at, terms_accepted_at, marketing_opt_in, consent_text, referrer_host, utm_source, utm_medium, utm_campaign, landing_path, inquiry_products(product_name, position)',
        )
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, to),
    'inquiries',
  );
  return {
    headers: [
      `Received (${zone})`,
      'Status',
      'Name',
      'Company',
      'Email',
      'Phone',
      'Interested in',
      'Products',
      'Message',
      'Came from',
      'Referring site',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'First page',
      `Read (${zone})`,
      `Replied (${zone})`,
      `Terms accepted (${zone})`,
      'Asked for marketing email',
      'Consent wording',
      'Inquiry id',
    ],
    rows: rows.map((row) => [
      stamp(row.created_at, zone),
      row.status,
      row.name,
      row.company,
      row.email,
      row.phone,
      row.interest,
      [...(row.inquiry_products ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((product) => product.product_name)
        .join(', '),
      row.message,
      channelOf({ utmSource: row.utm_source, utmMedium: row.utm_medium, utmCampaign: row.utm_campaign, referrerHost: row.referrer_host }).label,
      row.referrer_host,
      row.utm_source,
      row.utm_medium,
      row.utm_campaign,
      row.landing_path,
      stamp(row.read_at, zone),
      stamp(row.replied_at, zone),
      stamp(row.terms_accepted_at, zone),
      row.marketing_opt_in,
      row.consent_text,
      row.id,
    ]),
  };
}

async function clients(supabase: Client, zone: string): Promise<Sheet> {
  const [people, activity] = await Promise.all([
    all(
      (from, to) =>
        supabase
          .from('clients')
          .select('id, name, company, email, phone, first_active_at, last_active_at, marketing_opt_in, marketing_opt_in_at, marketing_opt_out_at')
          .order('last_active_at', { ascending: false })
          .order('id')
          .range(from, to),
      'clients',
    ),
    all(
      (from, to) => supabase.from('client_activity').select('id, client_id, kind, amount').in('kind', ['inquiry', 'order']).order('id').range(from, to),
      'client activity',
    ),
  ]);
  const totals = new Map<string, { inquiries: number; orders: number; sales: number }>();
  for (const item of activity) {
    const entry = totals.get(item.client_id) ?? { inquiries: 0, orders: 0, sales: 0 };
    if (item.kind === 'inquiry') entry.inquiries += 1;
    if (item.kind === 'order') {
      entry.orders += 1;
      entry.sales += Number(item.amount ?? 0);
    }
    totals.set(item.client_id, entry);
  }
  return {
    headers: [
      'Name',
      'Company',
      'Email',
      'Phone',
      'Inquiries',
      'Orders',
      'Sales (USD)',
      `First active (${zone})`,
      `Last active (${zone})`,
      'Marketing email',
      `Said yes (${zone})`,
      `Said no (${zone})`,
      'Client id',
    ],
    rows: people.map((person) => {
      const total = totals.get(person.id) ?? { inquiries: 0, orders: 0, sales: 0 };
      return [
        person.name,
        person.company,
        person.email,
        person.phone,
        total.inquiries,
        total.orders,
        money(total.sales),
        stamp(person.first_active_at, zone),
        stamp(person.last_active_at, zone),
        person.marketing_opt_in,
        stamp(person.marketing_opt_in_at, zone),
        stamp(person.marketing_opt_out_at, zone),
        person.id,
      ];
    }),
  };
}

async function orders(supabase: Client, zone: string): Promise<Sheet> {
  const rows = await all(
    (from, to) =>
      supabase
        .from('client_activity')
        .select('id, occurred_at, created_at, amount, note, client_id, clients(name, company, email)')
        .eq('kind', 'order')
        .order('occurred_at', { ascending: false })
        .order('id')
        .range(from, to),
    'orders',
  );
  return {
    headers: [`Order date (${zone})`, 'Amount (USD)', 'Client', 'Company', 'Email', 'Note', `Recorded (${zone})`, 'Client id', 'Order id'],
    rows: rows.map((row) => [
      stamp(row.occurred_at, zone),
      money(row.amount),
      row.clients?.name ?? '',
      row.clients?.company ?? '',
      row.clients?.email ?? '',
      row.note,
      stamp(row.created_at, zone),
      row.client_id,
      row.id,
    ]),
  };
}

/** Only clients whose latest answer is yes. Someone who said no since is left out. */
async function marketing(supabase: Client, zone: string): Promise<Sheet> {
  const rows = await all(
    (from, to) =>
      supabase
        .from('clients')
        .select('id, email, name, company, marketing_opt_in_at')
        .eq('marketing_opt_in', true)
        .order('email')
        .order('id')
        .range(from, to),
    'the marketing list',
  );
  return {
    headers: ['Email', 'Name', 'Company', `Said yes (${zone})`],
    rows: rows.map((row) => [row.email, row.name, row.company, stamp(row.marketing_opt_in_at, zone)]),
  };
}

const BUILDERS: Record<ExportKind, (supabase: Client, zone: string) => Promise<Sheet>> = { inquiries, clients, orders, marketing };

export async function buildExport(kind: ExportKind): Promise<{ filename: string; csv: string }> {
  const [supabase, zone] = [await createSessionClient(), await adminTimeZone()];
  const sheet = await BUILDERS[kind](supabase, zone);
  const filename = `fit-health-${kind === 'marketing' ? 'marketing-list' : kind}-${dayIn(new Date(), zone)}.csv`;
  return { filename, csv: toCsv(sheet.headers, sheet.rows) };
}
