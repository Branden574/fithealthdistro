import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { formatWhen } from './format';
import { adminTimeZone } from './time';

export type InquiryStatus = 'new' | 'read' | 'replied';
export const INQUIRY_STATUSES: readonly InquiryStatus[] = ['new', 'read', 'replied'];
export const INQUIRIES_PER_PAGE = 20;

/** PostgREST's answer to a range that starts past the last row. */
export const PAST_THE_END = 'PGRST103';

export interface AdminInquiry {
  id: string;
  clientId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  /** The categories they ticked, then the products they picked. */
  askedAbout: string[];
  status: InquiryStatus;
  /** Formatted in the admin's time zone. */
  receivedAt: string;
  readAt: string | null;
  repliedAt: string | null;
  termsAcceptedAt: string | null;
  marketingOptIn: boolean;
  consentText: string;
}

const COLUMNS =
  'id, client_id, name, company, email, phone, message, interest, status, created_at, read_at, replied_at, terms_accepted_at, marketing_opt_in, consent_text, inquiry_products(product_name, position)';

type Row = {
  id: string;
  client_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  interest: string;
  status: InquiryStatus;
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  terms_accepted_at: string | null;
  marketing_opt_in: boolean;
  consent_text: string;
  inquiry_products: Array<{ product_name: string; position: number }> | null;
};

function toInquiry(row: Row, zone: string, now: Date): AdminInquiry {
  const products = [...(row.inquiry_products ?? [])].sort((a, b) => a.position - b.position).map((product) => product.product_name);
  const topics = row.interest
    .split(', ')
    .map((topic) => topic.trim())
    .filter(Boolean);
  const when = (iso: string | null) => (iso ? formatWhen(iso, zone, now) : null);
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    message: row.message,
    askedAbout: [...new Set([...topics, ...products])],
    status: row.status,
    receivedAt: formatWhen(row.created_at, zone, now),
    readAt: when(row.read_at),
    repliedAt: when(row.replied_at),
    termsAcceptedAt: when(row.terms_accepted_at),
    marketingOptIn: row.marketing_opt_in,
    consentText: row.consent_text,
  };
}

/** How many inquiries are in each state. Read as the admin. */
export async function getInquiryCounts(): Promise<Record<InquiryStatus, number>> {
  const supabase = await createSessionClient();
  const counts = await Promise.all(
    INQUIRY_STATUSES.map((status) => supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', status)),
  );
  const failed = counts.find((result) => result.error);
  if (failed?.error) throw new Error(`Could not count inquiries: ${failed.error.message}`);
  return { new: counts[0].count ?? 0, read: counts[1].count ?? 0, replied: counts[2].count ?? 0 };
}

/** One page of inquiries in a state, newest first. Call `requireAdmin` first. */
export async function listInquiries(status: InquiryStatus, page: number): Promise<{ inquiries: AdminInquiry[]; total: number }> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const from = (page - 1) * INQUIRIES_PER_PAGE;
  const { data, error, count } = await supabase
    .from('inquiries')
    .select(COLUMNS, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, from + INQUIRIES_PER_PAGE - 1);
  if (error?.code === PAST_THE_END) {
    // A page past the last one: nothing here, and the true total so the page can send the admin to the last page.
    const counted = await supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', status);
    if (counted.error) throw new Error(`Could not count inquiries: ${counted.error.message}`);
    return { inquiries: [], total: counted.count ?? 0 };
  }
  if (error) throw new Error(`Could not read inquiries: ${error.message}`);
  return { inquiries: (data as Row[]).map((row) => toInquiry(row, zone, now)), total: count ?? 0 };
}

/** One inquiry, or null. Call `requireAdmin` first. */
export async function getInquiry(id: string): Promise<AdminInquiry | null> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const { data, error } = await supabase.from('inquiries').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(`Could not read the inquiry: ${error.message}`);
  return data ? toInquiry(data as Row, zone, now) : null;
}

/** A mail to the client with the subject filled in. Opening it does not mean it was sent. */
export function replyHref(inquiry: Pick<AdminInquiry, 'email' | 'name'>): string {
  const first = inquiry.name.split(' ')[0] ?? '';
  const subject = encodeURIComponent('Your quote request');
  const body = encodeURIComponent(`Hi ${first},\n\n`);
  return `mailto:${encodeURIComponent(inquiry.email).replace('%40', '@')}?subject=${subject}&body=${body}`;
}
