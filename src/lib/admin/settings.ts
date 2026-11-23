import 'server-only';
import { createSessionClient } from '@/lib/supabase/server';
import { formatDay } from './format';
import { adminTimeZone } from './time';

export interface AdminListRow {
  id: string;
  name: string;
  email: string;
  added: string;
  /** Who added them, or null for the first admin, set up with the site. */
  addedBy: string | null;
}

/** The business's public contact details and the admin list. Call `requireAdmin` first. */
export async function getSettings(): Promise<{ contact: { email: string; phone: string }; admins: AdminListRow[] }> {
  const supabase = await createSessionClient();
  const [zone, now] = [await adminTimeZone(), new Date()];
  const [settings, admins] = await Promise.all([
    supabase.from('business_settings').select('public_email, public_phone').eq('id', 1).maybeSingle(),
    supabase.from('admins').select('user_id, name, email, created_at, created_by').order('created_at'),
  ]);
  for (const result of [settings, admins]) if (result.error) throw new Error(`Could not read the settings: ${result.error.message}`);
  const rows = admins.data ?? [];
  const names = new Map(rows.map((row) => [row.user_id, row.name.trim() || row.email]));
  return {
    contact: { email: settings.data?.public_email ?? '', phone: settings.data?.public_phone ?? '' },
    admins: rows.map((row) => ({
      id: row.user_id,
      name: row.name.trim(),
      email: row.email,
      added: formatDay(row.created_at, zone, now),
      addedBy: row.created_by ? (names.get(row.created_by) ?? 'a former admin') : null,
    })),
  };
}
