'use client';

import { EmptyState, InquiryCard, Tabs } from '@ds';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { Pager, useAdminLinks } from '@/components/admin/links';
import { NoticeBar, takeNotice, type Notice } from '@/components/admin/Notice';
import type { AdminInquiry, InquiryStatus } from '@/lib/admin/inquiries';
import { inquiriesPath, inquiryPath } from '@/lib/admin/paths';
import { STATUS_LABELS, useInquiryStatus } from './useInquiryStatus';

export type InquiryItem = AdminInquiry & { replyHref: string };

interface InquiriesViewProps {
  status: InquiryStatus;
  counts: Record<InquiryStatus, number>;
  inquiries: InquiryItem[];
  page: number;
  perPage: number;
  total: number;
}

const PANEL_ID = 'inquiry-list';

const EMPTY: Record<InquiryStatus, { title: string; description: string }> = {
  new: { title: 'No new inquiries', description: 'Requests from the contact form land here first.' },
  read: { title: 'Nothing waiting on a reply', description: 'Inquiries you have opened but not answered wait here.' },
  replied: { title: 'No replies yet', description: 'Mark an inquiry as replied once your mail has gone, and it moves here.' },
};

/** Every inquiry, newest first, under New, Read and Replied. */
export function InquiriesView({ status, counts, inquiries, page, perPage, total }: InquiriesViewProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tab, setTab] = useState(status);
  const [switching, startSwitch] = useTransition();
  const noticeId = useRef(0);
  const follow = useAdminLinks();
  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });
  const { shown, busy, move, replying } = useInquiryStatus(inquiries, say);

  // What the page before left to say: an inquiry was removed.
  useEffect(() => {
    const left = takeNotice();
    if (left) setNotice({ ...left, id: ++noticeId.current });
  }, []);

  function choose(id: string) {
    const next = id as InquiryStatus;
    setTab(next);
    startSwitch(() => router.push(inquiriesPath(next)));
  }

  const selected = switching ? tab : status;
  const empty = EMPTY[status];

  return (
    <>
      <AdminPageHead eyebrow="Clients" title="Inquiries" />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <div className="admin-tabs">
        <Tabs
          items={(['new', 'read', 'replied'] as const).map((id) => ({ id, label: STATUS_LABELS[id], count: counts[id] }))}
          value={selected}
          onChange={choose}
          ariaLabel="Inquiries by status"
          panelId={PANEL_ID}
        />
      </div>
      <section id={PANEL_ID} role="tabpanel" aria-labelledby={`${PANEL_ID}-tab-${selected}`} aria-busy={switching || undefined} className="admin-inquiry-panel" onClick={follow}>
        <h2 className="fhd-sr">{STATUS_LABELS[status]} inquiries</h2>
        {shown.length ? (
          <ul className="admin-inquiries fhd-appear-list">
            {shown.map((inquiry, index) => (
              <li key={inquiry.id} style={{ ['--fhd-i' as string]: index }}>
                <InquiryCard
                  name={inquiry.name}
                  company={inquiry.company}
                  email={inquiry.email}
                  phone={inquiry.phone}
                  receivedAt={inquiry.receivedAt}
                  message={inquiry.message}
                  interestedIn={inquiry.askedAbout}
                  status={inquiry.status}
                  href={inquiryPath(inquiry.id)}
                  replyHref={inquiry.replyHref}
                  onReply={() => replying(inquiry)}
                  onMarkRead={() => move(inquiry, 'read', inquiry.status)}
                  onMarkReplied={() => move(inquiry, 'replied', inquiry.status)}
                  busy={busy.includes(inquiry.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="admin-inquiry-empty">
            <EmptyState icon="tray" title={empty.title} description={empty.description} />
          </div>
        )}
        <Pager page={page} perPage={perPage} total={total} hrefFor={(to) => inquiriesPath(status, to)} noun="inquiries" />
      </section>
    </>
  );
}
