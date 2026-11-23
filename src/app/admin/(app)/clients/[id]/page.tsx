import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClientDetail } from '@/components/admin/clients/ClientDetail';
import { requireAdmin } from '@/lib/admin/auth';
import { getClient } from '@/lib/admin/clients';
import { dayIn } from '@/lib/admin/format';
import { UUID } from '@/lib/admin/product-form';

export const metadata: Metadata = { title: 'Client' };

export default async function ClientPage({ params }: PageProps<'/admin/clients/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const found = await getClient(id);
  if (!found) notFound();
  return (
    <ClientDetail
      key={found.client.id}
      client={found.client}
      inquiries={found.inquiries}
      activity={found.activity}
      today={dayIn(new Date(), found.zone)}
    />
  );
}
