import type { Metadata } from 'next';
import { SiteContentView } from '@/components/admin/content/SiteContentView';
import { requireAdmin } from '@/lib/admin/auth';
import { getSiteContent } from '@/lib/admin/content';

export const metadata: Metadata = { title: 'Site content' };

export default async function SiteContentPage({ searchParams }: PageProps<'/admin/content'>) {
  await requireAdmin();
  const [{ tab }, content] = await Promise.all([searchParams, getSiteContent()]);
  return <SiteContentView {...content} initialTab={tab === 'faqs' ? 'faqs' : 'copy'} />;
}
