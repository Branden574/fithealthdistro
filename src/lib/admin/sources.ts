import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { byChannel, type ChannelCount } from './channels';
import { adminTimeZone } from './time';

export interface SourcePeriod {
  days: number;
  inquiries: number;
  channels: ChannelCount[];
}

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const record = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const list = (value: unknown) => (Array.isArray(value) ? value : []);

/** Inquiries over the last 30, 60 and 90 days by channel, with conversions. Call `requireAdmin` first. */
export async function getInquirySources(): Promise<SourcePeriod[]> {
  const supabase = await createSessionClient();
  const zone = await adminTimeZone();
  const { data, error } = await supabase.rpc('inquiry_sources', { p_tz: zone });
  if (error) throw new Error(`Could not work out where inquiries come from: ${error.message}`);
  return list(record(data).periods).map((entry) => {
    const period = record(entry);
    const rows = list(period.sources).map((item) => {
      const row = record(item);
      return {
        utmSource: text(row.utmSource),
        utmMedium: text(row.utmMedium),
        utmCampaign: text(row.utmCampaign),
        referrerHost: text(row.referrerHost),
        inquiries: num(row.inquiries),
        converted: num(row.converted),
      };
    });
    return { days: num(period.days), inquiries: rows.reduce((sum, row) => sum + row.inquiries, 0), channels: byChannel(rows) };
  });
}
