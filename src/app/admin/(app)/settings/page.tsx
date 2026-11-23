import type { Metadata } from 'next';
import { SettingsView } from '@/components/admin/settings/SettingsView';
import { requireAdmin } from '@/lib/admin/auth';
import { getSettings } from '@/lib/admin/settings';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const { contact, admins } = await getSettings();
  const mine = admins.find((row) => row.id === admin.id);
  return (
    <SettingsView
      contact={contact}
      admins={admins}
      me={{ id: admin.id, name: mine?.name ?? '', email: admin.email, temporaryPassword: admin.temporaryPassword }}
    />
  );
}
