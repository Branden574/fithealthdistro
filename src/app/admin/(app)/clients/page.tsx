import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ClientsView } from '@/components/admin/clients/ClientsView';
import { requireAdmin } from '@/lib/admin/auth';
import { cleanSearch, CLIENTS_PER_PAGE, listClients } from '@/lib/admin/clients';
import { clientsPath, pageNumber } from '@/lib/admin/paths';

export const metadata: Metadata = { title: 'Clients' };

export default async function ClientsPage({ searchParams }: PageProps<'/admin/clients'>) {
  await requireAdmin();
  const query = await searchParams;
  const search = cleanSearch(query.q);
  const page = pageNumber(query.page);
  const { clients, total } = await listClients(search, page);
  if (!clients.length && page > 1) redirect(clientsPath(search, Math.max(1, Math.ceil(total / CLIENTS_PER_PAGE))));
  return <ClientsView clients={clients} search={search} page={page} perPage={CLIENTS_PER_PAGE} total={total} />;
}
