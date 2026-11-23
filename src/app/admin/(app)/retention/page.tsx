import type { Metadata } from 'next';
import { RetentionView } from '@/components/admin/dashboard/RetentionView';
import { requireAdmin } from '@/lib/admin/auth';
import { getDashboardStats } from '@/lib/admin/dashboard';

export const metadata: Metadata = { title: 'Retention' };

/** Client retention month by month, with how each figure is worked out. */
export default async function RetentionPage() {
  await requireAdmin();
  const { months } = await getDashboardStats();
  return <RetentionView months={months} />;
}
