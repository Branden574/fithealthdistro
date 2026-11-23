'use client';

import { Badge, Button, DataTable, EmptyState, Icon, Panel, TextField, type DataTableColumn } from '@ds';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { Pager, useAdminLinks } from '@/components/admin/links';
import { NoticeBar, takeNotice, type Notice } from '@/components/admin/Notice';
import type { AdminClientRow } from '@/lib/admin/clients';
import { CLIENTS_PATH, clientPath, clientsPath } from '@/lib/admin/paths';

interface ClientsViewProps {
  clients: AdminClientRow[];
  search: string;
  page: number;
  perPage: number;
  total: number;
}

/** Everyone who has sent an inquiry, most recently active first, with a search. */
export function ClientsView({ clients, search, page, perPage, total }: ClientsViewProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [searching, startSearch] = useTransition();
  const noticeId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const follow = useAdminLinks();

  // What the page before left to say: a client was removed.
  useEffect(() => {
    const left = takeNotice();
    if (left) setNotice({ ...left, id: ++noticeId.current });
  }, []);

  // The box shows the search the list is for, such as after Clear search, without being redrawn under the cursor.
  useEffect(() => {
    const box = formRef.current?.elements.namedItem('q');
    if (box instanceof HTMLInputElement && box.value.trim() !== search) box.value = search;
  }, [search]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    startSearch(() => router.push(clientsPath(typeof value === 'string' ? value.trim().slice(0, 60) : '')));
  }

  const columns: Array<DataTableColumn<AdminClientRow>> = [
    {
      key: 'name',
      header: 'Client',
      minWidth: 220,
      render: (row) => (
        <span className="admin-cell-stack">
          <a className="admin-link" href={clientPath(row.id)}>
            {row.name}
          </a>
          {row.company ? <span className="admin-muted">{row.company}</span> : null}
        </span>
      ),
    },
    { key: 'email', header: 'Email', nowrap: true },
    { key: 'phone', header: 'Phone', nowrap: true, render: (row) => row.phone || <span className="admin-muted">Not given</span> },
    { key: 'inquiryCount', header: 'Inquiries', mono: true, align: 'right' },
    { key: 'lastActive', header: 'Last active', nowrap: true },
    {
      key: 'marketingOptIn',
      header: 'Marketing email',
      nowrap: true,
      render: (row) => (row.marketingOptIn ? <Badge tone="success">Opted in</Badge> : <Badge tone="neutral">No</Badge>),
    },
  ];

  return (
    <>
      <AdminPageHead eyebrow="Clients" title="Clients" />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <Panel
        flush
        title="Clients"
        description="Everyone who has sent an inquiry, most recently active first. One email is one client."
        footer={<Pager page={page} perPage={perPage} total={total} hrefFor={(to) => clientsPath(search, to)} noun="clients" />}
      >
        <div className="admin-toolbar">
          <form ref={formRef} role="search" className="admin-search" action={CLIENTS_PATH} method="get" onSubmit={submit}>
            <TextField
              type="search"
              name="q"
              label="Search clients"
              hideLabel
              placeholder="Name, email or company"
              defaultValue={search}
              maxLength={60}
              prefix={<Icon name="magnifying-glass" size={16} />}
            />
            <Button type="submit" size="md" loading={searching}>
              Search
            </Button>
          </form>
          <p className="fhd-sr" aria-live="polite">
            {searching ? '' : search ? `${total} ${total === 1 ? 'client matches' : 'clients match'} ${search}` : ''}
          </p>
        </div>
        <div onClick={follow} aria-busy={searching || undefined}>
          <DataTable
            caption={search ? `Clients matching ${search}` : 'Clients'}
            columns={columns}
            rows={clients}
            rowKey={(row) => row.id}
            empty={
              search ? (
                <EmptyState
                  compact
                  icon="magnifying-glass"
                  title="No clients match"
                  description={`Nothing matches “${search}”. Try part of a name, an email or a company.`}
                  action={
                    <Button size="sm" href={CLIENTS_PATH}>
                      Clear search
                    </Button>
                  }
                />
              ) : (
                <EmptyState compact icon="users-three" title="No clients yet" description="Clients appear here when they send an inquiry from the website." />
              )
            }
          />
        </div>
      </Panel>
    </>
  );
}
