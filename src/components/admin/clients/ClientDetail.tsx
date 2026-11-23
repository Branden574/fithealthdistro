'use client';

import { Badge, Button, DataTable, Dialog, EmptyState, Panel, type DataTableColumn } from '@ds';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { useAdminLinks } from '@/components/admin/links';
import { leaveNotice, NoticeBar, problemNotice, type Notice } from '@/components/admin/Notice';
import { removeActivity, removeClient, stopMarketing } from '@/lib/admin/client-actions';
import type { AdminClient, ClientActivityItem, ClientInquiry } from '@/lib/admin/clients';
import type { InquiryStatus } from '@/lib/admin/inquiries';
import { CLIENTS_PATH, inquiryPath } from '@/lib/admin/paths';
import { EditClientDialog, RecordActivityDialog } from './ClientDialogs';

interface ClientDetailProps {
  client: AdminClient;
  inquiries: ClientInquiry[];
  activity: ClientActivityItem[];
  /** The admin's calendar day. */
  today: string;
}

type Confirm = { kind: 'marketing' } | { kind: 'client' } | { kind: 'activity'; item: ClientActivityItem };
type Open = 'edit' | 'record' | null;

const STATUS: Record<InquiryStatus, { label: string; tone: 'accent' | 'neutral' | 'success' }> = {
  new: { label: 'New', tone: 'accent' },
  read: { label: 'Read', tone: 'neutral' },
  replied: { label: 'Replied', tone: 'success' },
};

const KIND: Record<ClientActivityItem['kind'], string> = { inquiry: 'Inquiry', order: 'Order', manual: 'Recorded' };

/** One client: how to reach them, whether they want marketing email, what they have done, and what they sent. */
export function ClientDetail({ client, inquiries, activity, today }: ClientDetailProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [open, setOpen] = useState<Open>(null);
  const [formKey, setFormKey] = useState(0);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, startWork] = useTransition();
  const noticeId = useRef(0);
  const follow = useAdminLinks();
  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });

  function show(which: Exclude<Open, null>) {
    setFormKey((key) => key + 1);
    setOpen(which);
  }

  function ask(next: Confirm) {
    setConfirm(next);
    setConfirmOpen(true);
  }

  function confirmed() {
    const what = confirm;
    if (!what) return;
    startWork(async () => {
      if (what.kind === 'client') {
        const result = await removeClient(client.id);
        if (!result.ok) {
          setConfirmOpen(false);
          say(problemNotice(result.reason, 'client'));
          return;
        }
        leaveNotice({ tone: 'success', title: `Removed ${client.name}`, body: 'Their inquiries and activity are gone too.' });
        router.push(CLIENTS_PATH);
        router.refresh();
        return;
      }
      const result = what.kind === 'marketing' ? await stopMarketing(client.id) : await removeActivity(what.item.id);
      setConfirmOpen(false);
      if (!result.ok) {
        say(problemNotice(result.reason, what.kind === 'marketing' ? 'client' : 'activity'));
        return;
      }
      say(
        what.kind === 'marketing'
          ? { tone: 'success', title: 'Stopped marketing email', body: `Send ${client.name} no more marketing. They can opt in again from the contact form.` }
          : { tone: 'success', title: 'Removed the activity', body: 'Last active and retention now leave it out.' },
      );
    });
  }

  const activityColumns: Array<DataTableColumn<ClientActivityItem>> = [
    { key: 'when', header: 'Day', nowrap: true },
    {
      key: 'kind',
      header: 'What',
      minWidth: 220,
      render: (row) => (
        <span className="admin-cell-name">
          <Badge tone={row.kind === 'manual' ? 'info' : 'neutral'}>{KIND[row.kind]}</Badge>
          {row.note ? <span>{row.note}</span> : null}
          {row.kind === 'inquiry' && row.inquiryId ? (
            <a className="admin-link" href={inquiryPath(row.inquiryId)}>
              Open inquiry
            </a>
          ) : null}
        </span>
      ),
    },
    { key: 'by', header: 'By', nowrap: true, render: (row) => (row.kind === 'manual' ? row.by : <span className="admin-muted">Contact form</span>) },
    {
      key: 'actions',
      header: <span className="fhd-sr">Actions</span>,
      align: 'right',
      render: (row) =>
        row.kind === 'manual' ? (
          <Button size="sm" variant="ghost" icon="trash" aria-label={`Remove the activity from ${row.when}`} onClick={() => ask({ kind: 'activity', item: row })} />
        ) : null,
    },
  ];

  const inquiryColumns: Array<DataTableColumn<ClientInquiry>> = [
    {
      key: 'receivedAt',
      header: 'Received',
      nowrap: true,
      render: (row) => (
        <a className="admin-link" href={inquiryPath(row.id)}>
          {row.receivedAt}
        </a>
      ),
    },
    { key: 'interest', header: 'Asked about', minWidth: 200, render: (row) => row.interest || <span className="admin-muted">Nothing picked</span> },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (row) => (
        <Badge tone={STATUS[row.status].tone} dot={row.status === 'new'}>
          {STATUS[row.status].label}
        </Badge>
      ),
    },
  ];

  const marketing = client.marketingOptIn
    ? { badge: <Badge tone="success">Opted in</Badge>, text: `They asked for marketing email${client.marketingOptInAt ? ` on ${client.marketingOptInAt}` : ''}.` }
    : {
        badge: <Badge tone="neutral">No</Badge>,
        text: client.marketingOptOutAt
          ? `Stopped on ${client.marketingOptOutAt}. Send no marketing email unless they opt in again from the contact form.`
          : 'They have not asked for marketing email. Reply to their inquiries only.',
      };

  const confirmCopy =
    confirm?.kind === 'client'
      ? {
          title: `Remove ${client.name}?`,
          description: `Their contact details, ${inquiries.length === 1 ? 'their inquiry' : `their ${inquiries.length} inquiries`} and their activity are deleted for good. Use this when someone asks to be forgotten.`,
          action: 'Remove client',
          cancel: 'Keep client',
        }
      : confirm?.kind === 'marketing'
        ? {
            title: 'Stop marketing email?',
            description: `${client.name} is marked as not wanting marketing email from today. Only they can opt in again, from the contact form.`,
            action: 'Stop marketing email',
            cancel: 'Cancel',
          }
        : {
            title: 'Remove this activity?',
            description: 'It no longer counts toward last active or retention. Inquiries are not affected.',
            action: 'Remove activity',
            cancel: 'Keep it',
          };

  return (
    <>
      <AdminPageHead
        eyebrow="Clients"
        title={client.name}
        actions={
          <>
            <Button iconLeft="arrow-left" href={CLIENTS_PATH}>
              All clients
            </Button>
            <Button variant="primary" iconLeft="plus" onClick={() => show('record')}>
              Record activity
            </Button>
          </>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <div className="admin-detail admin-detail--side-first" onClick={follow}>
        <div className="admin-detail__side">
          <Panel
            title="Contact details"
            actions={
              <Button size="sm" variant="ghost" iconLeft="pencil-simple" onClick={() => show('edit')}>
                Edit
              </Button>
            }
          >
            <dl className="admin-facts">
              <div>
                <dt className="label">Company</dt>
                <dd>{client.company || <span className="admin-muted">Not given</span>}</dd>
              </div>
              <div>
                <dt className="label">Email</dt>
                <dd>
                  <a className="admin-link" href={`mailto:${client.email}`}>
                    {client.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label">Phone</dt>
                <dd>
                  {client.phone ? (
                    <a className="admin-link" href={`tel:${client.phone.replace(/[^+\d]/g, '')}`}>
                      {client.phone}
                    </a>
                  ) : (
                    <span className="admin-muted">Not given</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label">First active</dt>
                <dd>{client.firstActive}</dd>
              </div>
              <div>
                <dt className="label">Last active</dt>
                <dd>{client.lastActive}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Marketing email" actions={marketing.badge}>
            <div className="admin-stack">
              <p className="admin-note">{marketing.text}</p>
              {client.marketingOptIn ? (
                <Button size="sm" variant="outline" onClick={() => ask({ kind: 'marketing' })}>
                  Stop marketing email
                </Button>
              ) : null}
            </div>
          </Panel>
        </div>
        <div className="admin-detail__main">
          <Panel
            flush
            title="Activity"
            description="Each entry counts toward retention. Inquiries add one on their own; record calls, visits and phone orders."
            footer={activity.length >= 100 ? 'Showing the latest 100' : undefined}
          >
            <DataTable
              caption={`Activity for ${client.name}`}
              columns={activityColumns}
              rows={activity}
              rowKey={(row) => row.id}
              empty={<EmptyState compact icon="clock" title="No activity yet" description="Record a call, a visit or a phone order to start." />}
            />
          </Panel>
          <Panel flush title="Inquiries" description="What they sent through the contact form, newest first." footer={inquiries.length >= 100 ? 'Showing the latest 100' : undefined}>
            <DataTable
              caption={`Inquiries from ${client.name}`}
              columns={inquiryColumns}
              rows={inquiries}
              rowKey={(row) => row.id}
              empty={<EmptyState compact icon="tray" title="No inquiries left" description="Removed inquiries do not show here." />}
            />
          </Panel>
          <Panel title="Remove client" description="For someone who asks to be forgotten. Everything they sent goes with them.">
            <Button variant="danger" size="sm" iconLeft="trash" onClick={() => ask({ kind: 'client' })}>
              Remove client
            </Button>
          </Panel>
        </div>
      </div>

      {formKey > 0 ? (
        <>
          <EditClientDialog
            key={`edit-${formKey}`}
            open={open === 'edit'}
            client={client}
            onClose={() => setOpen(null)}
            onSaved={() => {
              setOpen(null);
              say({ tone: 'success', title: 'Saved contact details', body: 'Their next inquiry leaves them as you set them.' });
            }}
          />
          <RecordActivityDialog
            key={`record-${formKey}`}
            open={open === 'record'}
            client={client}
            today={today}
            onClose={() => setOpen(null)}
            onSaved={() => {
              setOpen(null);
              say({ tone: 'success', title: 'Recorded the activity', body: 'It counts toward retention from now on.' });
            }}
          />
        </>
      ) : null}

      <Dialog
        open={confirmOpen}
        onClose={() => (working ? undefined : setConfirmOpen(false))}
        size="sm"
        title={confirmCopy.title}
        description={confirmCopy.description}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={working}>
              {confirmCopy.cancel}
            </Button>
            <Button variant={confirm?.kind === 'marketing' ? 'solid' : 'danger'} onClick={confirmed} loading={working}>
              {confirmCopy.action}
            </Button>
          </>
        }
      />
    </>
  );
}
