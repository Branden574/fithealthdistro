import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { formatDay, formatWhen } from './format';
import { PAST_THE_END, type InquiryStatus } from './inquiries';
import { adminTimeZone } from './time';

export const CLIENTS_PER_PAGE = 25;

export interface AdminClientRow {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiryCount: number;
  /** Formatted in the admin's time zone. */
  lastActive: string;
  marketingOptIn: boolean;
}

export interface AdminClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  firstActive: string;
  lastActive: string;
  marketingOptIn: boolean;
  marketingOptInAt: string | null;
  marketingOptOutAt: string | null;
}

export interface ClientInquiry {
  id: string;
  receivedAt: string;
  status: InquiryStatus;
  interest: string;
}

export interface ClientActivityItem {
  id: string;
  kind: 'inquiry' | 'order' | 'manual';
  note: string;
  when: string;
  /** The admin who recorded it, for activity recorded by hand. */
  by: string;
  inquiryId: string | null;
}

/**
 * Letters, digits and the few marks names and emails use. Everything else, which the filter syntax could read, goes.
 * An underscore stays: emails use it, and as a wildcard for one character it still finds the address it was typed from.
 */
export function cleanSearch(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .slice(0, 200)
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}@._+' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/** One page of clients, most recently active first, optionally matching a search. Call `requireAdmin` first. */
export async function listClients(search: string, page: number): Promise<{ clients: AdminClientRow[]; total: number }> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const from = (page - 1) * CLIENTS_PER_PAGE;
  let query = supabase
    .from('clients')
    .select('id, name, company, email, phone, last_active_at, marketing_opt_in, inquiries(count)', { count: 'exact' })
    .order('last_active_at', { ascending: false })
    .order('id')
    .range(from, from + CLIENTS_PER_PAGE - 1);
  // Quoted, so a dot in an email is read as text. cleanSearch has already removed quotes, commas and brackets.
  const filter = ['name', 'email', 'company'].map((column) => `${column}.ilike."*${search}*"`).join(',');
  if (search) query = query.or(filter);
  const { data, error, count } = await query;
  if (error?.code === PAST_THE_END) {
    // A page past the last one: nothing here, and the true total so the page can send the admin to the last page.
    let counting = supabase.from('clients').select('id', { count: 'exact', head: true });
    if (search) counting = counting.or(filter);
    const counted = await counting;
    if (counted.error) throw new Error(`Could not count clients: ${counted.error.message}`);
    return { clients: [], total: counted.count ?? 0 };
  }
  if (error) throw new Error(`Could not read clients: ${error.message}`);
  return {
    clients: data.map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      inquiryCount: (row.inquiries as unknown as Array<{ count: number }> | null)?.[0]?.count ?? 0,
      lastActive: formatDay(row.last_active_at, zone, now),
      marketingOptIn: row.marketing_opt_in,
    })),
    total: count ?? 0,
  };
}

/** One client with their inquiries and activity, or null. Call `requireAdmin` first. */
export async function getClient(
  id: string,
): Promise<{ client: AdminClient; inquiries: ClientInquiry[]; activity: ClientActivityItem[]; zone: string } | null> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const [client, inquiries, activity, admins] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, company, email, phone, first_active_at, last_active_at, marketing_opt_in, marketing_opt_in_at, marketing_opt_out_at')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('inquiries').select('id, created_at, status, interest').eq('client_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('client_activity').select('id, kind, note, occurred_at, created_by, inquiry_id').eq('client_id', id).order('occurred_at', { ascending: false }).limit(100),
    supabase.from('admins').select('user_id, name, email'),
  ]);
  for (const result of [client, inquiries, activity, admins]) if (result.error) throw new Error(`Could not read the client: ${result.error.message}`);
  const row = client.data;
  if (!row) return null;
  const names = new Map((admins.data ?? []).map((admin) => [admin.user_id, admin.name.trim() || admin.email]));
  const day = (iso: string | null) => (iso ? formatDay(iso, zone, now) : null);
  return {
    zone,
    client: {
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      firstActive: formatDay(row.first_active_at, zone, now),
      lastActive: formatDay(row.last_active_at, zone, now),
      marketingOptIn: row.marketing_opt_in,
      marketingOptInAt: day(row.marketing_opt_in_at),
      marketingOptOutAt: day(row.marketing_opt_out_at),
    },
    inquiries: (inquiries.data ?? []).map((inquiry) => ({
      id: inquiry.id,
      receivedAt: formatWhen(inquiry.created_at, zone, now),
      status: inquiry.status,
      interest: inquiry.interest,
    })),
    activity: (activity.data ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      note: item.note,
      when: formatDay(item.occurred_at, zone, now),
      by: item.created_by ? (names.get(item.created_by) ?? 'A former admin') : '',
      inquiryId: item.inquiry_id,
    })),
  };
}
