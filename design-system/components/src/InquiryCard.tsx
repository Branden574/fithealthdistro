import * as React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx, initials } from './util';

export interface InquiryCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The client's name. */
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  /** City and state, or the site the machine is for. */
  location?: string;
  /** When it arrived, already formatted: "Nov 22, 9:41 AM". */
  receivedAt: string;
  /** What the client wrote. Line breaks are kept. */
  message: string;
  /** Names of the products the client asked about. */
  interestedIn?: string[];
  /** `new` has not been opened, `read` has, `replied` is done. */
  status?: 'new' | 'read' | 'replied';
  /** Called by the Reply button. Without it, Reply opens a mail to `email`. With `replyHref`, it runs as the mail opens. */
  onReply?: () => void;
  /** Where Reply goes: a `mailto:` with a subject, say. Reply then stays a link, so the mail opens however `onReply` is set. */
  replyHref?: string;
  /** Called by Mark as read, which shows only while `status` is `new`. */
  onMarkRead?: () => void;
  /**
   * Called by Mark as replied, which shows until `status` is `replied`. Opening a mail is not replying: the admin says so
   * here once the mail has gone.
   */
  onMarkReplied?: () => void;
  /** The inquiry's own page. The client's name links to it. */
  href?: string;
  /** While a change is being saved: the buttons wait. */
  busy?: boolean;
  /** The footer line that tells the admin who can see this. Pass `false` to hide it. */
  privacyNote?: string | false;
}

const STATUS = {
  new: { label: 'New', tone: 'accent' },
  read: { label: 'Read', tone: 'neutral' },
  replied: { label: 'Replied', tone: 'success' },
} as const;

/** Everything a client sent through the contact form, in one place, for admins only. */
export function InquiryCard(props: InquiryCardProps) {
  const {
    name,
    company,
    email,
    phone,
    location,
    receivedAt,
    message,
    interestedIn,
    status = 'new',
    onReply,
    replyHref,
    onMarkRead,
    onMarkReplied,
    href,
    busy = false,
    privacyNote = 'Visible to admins only',
    className,
    ...rest
  } = props;
  const state = STATUS[status];
  // Every card has the same buttons; naming the client as their description tells them apart for screen readers.
  const nameId = React.useId();
  return (
    <article className={cx('fhd-inquiry', status === 'new' && 'fhd-inquiry--new', className)} {...rest}>
      <header className="fhd-inquiry__head">
        <span className="fhd-inquiry__avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <div className="fhd-inquiry__who">
          <h3 className="fhd-inquiry__name" id={nameId}>{href ? <a href={href}>{name}</a> : name}</h3>
          <p className="fhd-inquiry__meta">{[company, receivedAt].filter(Boolean).join(' · ')}</p>
        </div>
        <Badge tone={state.tone} dot={status === 'new'}>
          {state.label}
        </Badge>
      </header>
      {email || phone || location ? (
        <ul className="fhd-inquiry__contact">
          {email ? (
            <li>
              <Icon name="envelope-simple" size={16} label="Email" />
              <a href={`mailto:${email}`}>{email}</a>
            </li>
          ) : null}
          {phone ? (
            <li>
              <Icon name="phone" size={16} label="Phone" />
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
            </li>
          ) : null}
          {location ? (
            <li>
              <Icon name="map-pin" size={16} label="Location" />
              <span>{location}</span>
            </li>
          ) : null}
        </ul>
      ) : null}
      <p className="fhd-inquiry__msg">{message}</p>
      {interestedIn && interestedIn.length ? (
        <div className="fhd-inquiry__interest">
          <span className="fhd-inquiry__interest-label">Asked about</span>
          {interestedIn.map((product) => (
            <Badge key={product}>{product}</Badge>
          ))}
        </div>
      ) : null}
      <footer className="fhd-inquiry__foot">
        {privacyNote ? (
          <span className="fhd-inquiry__private">
            <Icon name="lock-simple" size={16} />
            {privacyNote}
          </span>
        ) : (
          <span />
        )}
        <div className="fhd-inquiry__actions">
          {status === 'new' && onMarkRead ? (
            <Button size="sm" variant="outline" onClick={onMarkRead} disabled={busy} aria-describedby={nameId}>
              Mark as read
            </Button>
          ) : null}
          {status !== 'replied' && onMarkReplied ? (
            <Button size="sm" variant="outline" iconLeft="check" onClick={onMarkReplied} disabled={busy} aria-describedby={nameId}>
              Mark as replied
            </Button>
          ) : null}
          {replyHref || (!onReply && email) ? (
            <Button size="sm" variant="primary" iconLeft="envelope-simple" href={replyHref ?? `mailto:${email}`} onClick={onReply} aria-describedby={nameId}>
              Reply
            </Button>
          ) : onReply ? (
            <Button size="sm" variant="primary" iconLeft="envelope-simple" onClick={onReply} disabled={busy} aria-describedby={nameId}>
              Reply
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
