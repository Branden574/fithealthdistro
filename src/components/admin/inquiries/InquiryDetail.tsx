'use client';

import { Badge, Button, Dialog, InquiryCard, Panel } from '@ds';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { useAdminLinks } from '@/components/admin/links';
import { leaveNotice, NoticeBar, problemNotice, type Notice } from '@/components/admin/Notice';
import { channelOf, DIRECT } from '@/lib/admin/channels';
import { removeInquiry, setInquiryStatus } from '@/lib/admin/inquiry-actions';
import { clientPath, inquiriesPath } from '@/lib/admin/paths';
import type { InquiryItem } from './InquiriesView';
import { useInquiryStatus } from './useInquiryStatus';

/** One inquiry on its own page: the message, what the client agreed to, and where it stands. Opening it marks it read. */
export function InquiryDetail({ inquiry }: { inquiry: InquiryItem }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, startRemove] = useTransition();
  const [, startOpen] = useTransition();
  const noticeId = useRef(0);
  const opened = useRef<string | null>(null);
  const follow = useAdminLinks();
  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });
  const { shown, busy, move, replying } = useInquiryStatus([inquiry], say);
  const current = shown[0] ?? inquiry;
  const { source } = inquiry;
  const channel = channelOf(source);
  const tags = [source.utmSource, source.utmMedium, source.utmCampaign].filter(Boolean);

  // Opening it is reading it. Once per inquiry, and never over Read or Replied.
  useEffect(() => {
    if (opened.current === inquiry.id) return;
    opened.current = inquiry.id;
    if (inquiry.status !== 'new') return;
    startOpen(async () => {
      await setInquiryStatus(inquiry.id, 'read', 'new');
    });
  }, [inquiry.id, inquiry.status]);

  function confirmRemove() {
    startRemove(async () => {
      const result = await removeInquiry(inquiry.id);
      if (!result.ok) {
        setRemoveOpen(false);
        say(problemNotice(result.reason, 'inquiry'));
        return;
      }
      leaveNotice({ tone: 'success', title: 'Removed the inquiry', body: `${inquiry.name} stays in Clients, with anything else they sent.` });
      router.push(inquiriesPath(inquiry.status === 'replied' ? 'replied' : 'read'));
      router.refresh();
    });
  }

  return (
    <>
      <AdminPageHead
        eyebrow="Inquiries"
        title={inquiry.name}
        actions={
          <Button iconLeft="arrow-left" href={inquiriesPath(current.status)}>
            Back to inquiries
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <div className="admin-detail" onClick={follow}>
        <div className="admin-detail__main">
          <h2 className="fhd-sr">Message</h2>
          <InquiryCard
            name={current.name}
            company={current.company}
            email={current.email}
            phone={current.phone}
            receivedAt={current.receivedAt}
            message={current.message}
            interestedIn={current.askedAbout}
            status={current.status}
            replyHref={current.replyHref}
            onReply={() => replying(current)}
            onMarkRead={() => move(current, 'read', current.status)}
            onMarkReplied={() => move(current, 'replied', current.status)}
            busy={busy.includes(current.id)}
          />
        </div>
        <div className="admin-detail__side">
          <Panel title="Client" description="Everything they have sent, and what they did besides.">
            <div className="admin-stack">
              <p className="admin-facts__lead">
                <strong>{current.name}</strong>
                {current.company ? <span className="admin-muted">{current.company}</span> : null}
              </p>
              <Button size="sm" iconRight="arrow-right" href={clientPath(current.clientId)}>
                View client
              </Button>
            </div>
          </Panel>
          <Panel title="Consent" description="What they agreed to when they sent this, as the form put it.">
            <dl className="admin-facts">
              <div>
                <dt className="label">Terms accepted</dt>
                <dd>{current.termsAcceptedAt ?? 'Not recorded for this inquiry'}</dd>
              </div>
              <div>
                <dt className="label">Marketing email</dt>
                <dd>
                  {current.marketingOptIn ? (
                    <Badge tone="success">Asked for it</Badge>
                  ) : (
                    <Badge tone="neutral">Did not ask</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label">The form said</dt>
                <dd>{current.consentText ? <blockquote className="admin-quote">{current.consentText}</blockquote> : 'Not recorded for this inquiry'}</dd>
              </div>
            </dl>
            <p className="admin-muted admin-note">Whether they get marketing email now is on the client page: they may have said no since.</p>
          </Panel>
          <Panel title="How they found you" description="As their browser noted it when they arrived.">
            <dl className="admin-facts">
              <div>
                <dt className="label">Came from</dt>
                <dd>{channel.label}</dd>
              </div>
              {source.referrerHost && channel.label !== source.referrerHost ? (
                <div>
                  <dt className="label">Website</dt>
                  <dd>{source.referrerHost}</dd>
                </div>
              ) : null}
              {tags.length ? (
                <div>
                  <dt className="label">Link tags</dt>
                  <dd>
                    {[
                      source.utmSource && `Source: ${source.utmSource}`,
                      source.utmMedium && `Medium: ${source.utmMedium}`,
                      source.utmCampaign && `Campaign: ${source.utmCampaign}`,
                    ]
                      .filter(Boolean)
                      .join('. ')}
                  </dd>
                </div>
              ) : null}
              {source.landingPath ? (
                <div>
                  <dt className="label">First page</dt>
                  <dd>
                    <code className="data">{source.landingPath}</code>
                  </dd>
                </div>
              ) : null}
            </dl>
            {channel.key === DIRECT.key ? (
              <p className="admin-muted admin-note">
                They typed the address or used a bookmark, their app did not say where the link came from, or the inquiry came in before this was noted.
              </p>
            ) : null}
          </Panel>
          <Panel title="History">
            <dl className="admin-facts">
              <div>
                <dt className="label">Received</dt>
                <dd>{current.receivedAt}</dd>
              </div>
              <div>
                <dt className="label">Read</dt>
                <dd>{current.readAt ?? (current.status === 'new' ? 'Not yet' : 'Just now')}</dd>
              </div>
              <div>
                <dt className="label">Replied</dt>
                <dd>{current.repliedAt ?? 'Not marked yet'}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Remove inquiry" description="For spam or a mistake. The client, and anything else they sent, stays.">
            <Button variant="danger" size="sm" iconLeft="trash" onClick={() => setRemoveOpen(true)}>
              Remove inquiry
            </Button>
          </Panel>
        </div>
      </div>

      <Dialog
        open={removeOpen}
        onClose={() => (removing ? undefined : setRemoveOpen(false))}
        size="sm"
        title="Remove this inquiry?"
        description={`The message from ${inquiry.name} is deleted for good, with its consent record. To keep it out of the way instead, mark it as replied.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removing}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmRemove} loading={removing}>
              Remove inquiry
            </Button>
          </>
        }
      />
    </>
  );
}
