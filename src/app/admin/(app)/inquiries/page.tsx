import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { InquiriesView } from '@/components/admin/inquiries/InquiriesView';
import { requireAdmin } from '@/lib/admin/auth';
import { getInquiryCounts, INQUIRIES_PER_PAGE, INQUIRY_STATUSES, listInquiries, replyHref, type InquiryStatus } from '@/lib/admin/inquiries';
import { inquiriesPath, pageNumber } from '@/lib/admin/paths';

export const metadata: Metadata = { title: 'Inquiries' };

export default async function InquiriesPage({ searchParams }: PageProps<'/admin/inquiries'>) {
  await requireAdmin();
  const query = await searchParams;
  const status = INQUIRY_STATUSES.find((value) => value === query.status) ?? 'new';
  const page = pageNumber(query.page);
  const [counts, { inquiries, total }] = await Promise.all([getInquiryCounts(), listInquiries(status as InquiryStatus, page)]);
  // Past the last page (the list shrank, or an old link): the last page there is.
  if (!inquiries.length && page > 1) redirect(inquiriesPath(status, Math.max(1, Math.ceil(total / INQUIRIES_PER_PAGE))));
  return (
    <InquiriesView
      status={status}
      counts={counts}
      inquiries={inquiries.map((inquiry) => ({ ...inquiry, replyHref: replyHref(inquiry) }))}
      page={page}
      perPage={INQUIRIES_PER_PAGE}
      total={total}
    />
  );
}
