import type { Metadata } from 'next';
import { DashboardView } from '@/components/admin/dashboard/DashboardView';
import { requireAdmin } from '@/lib/admin/auth';
import { getDashboardStats } from '@/lib/admin/dashboard';
import { getLatestInquiry, replyHref } from '@/lib/admin/inquiries';
import { getInquirySources } from '@/lib/admin/sources';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = { title: 'Dashboard' };

/** The admin's home: clients, retention, inquiries and products at a glance, then sales, conversion and where inquiries come from. */
export default async function DashboardPage() {
  await requireAdmin();
  const [stats, latest, sources] = await Promise.all([getDashboardStats(), getLatestInquiry(), getInquirySources()]);
  return (
    <DashboardView
      stats={stats}
      latest={latest ? { ...latest, replyHref: replyHref(latest) } : null}
      sources={sources}
      tagLink={absoluteUrl('/?utm_source=flyer')}
    />
  );
}
