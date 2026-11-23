import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InquiryDetail } from '@/components/admin/inquiries/InquiryDetail';
import { requireAdmin } from '@/lib/admin/auth';
import { getInquiry, replyHref } from '@/lib/admin/inquiries';
import { UUID } from '@/lib/admin/product-form';

export const metadata: Metadata = { title: 'Inquiry' };

export default async function InquiryPage({ params }: PageProps<'/admin/inquiries/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  return <InquiryDetail key={inquiry.id} inquiry={{ ...inquiry, replyHref: replyHref(inquiry) }} />;
}
