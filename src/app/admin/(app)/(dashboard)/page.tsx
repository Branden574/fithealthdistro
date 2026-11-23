import type { Metadata } from 'next';
import { DashboardView } from '@/components/admin/dashboard/DashboardView';
import { requireAdmin } from '@/lib/admin/auth';
import { getDashboardStats } from '@/lib/admin/dashboard';
import { getLatestInquiry, replyHref } from '@/lib/admin/inquiries';

export const metadata: Metadata = { title: 'Dashboard' };

/** The admin's home: clients, retention, inquiries and products at a glance, then sales and conversion. */
export default async function DashboardPage() {
  await requireAdmin();
  const [stats, latest] = await Promise.all([getDashboardStats(), getLatestInquiry()]);
  return <DashboardView stats={stats} latest={latest ? { ...latest, replyHref: replyHref(latest) } : null} />;
}
