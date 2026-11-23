'use client';

import { Alert, Badge, Button, DataTable, Dialog, Panel, TextField, type DataTableColumn } from '@ds';
import { useCallback, useRef, useState, useTransition, type FormEvent } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { exportPath } from '@/lib/admin/paths';
import { NoticeBar, problemNotice, type Notice } from '@/components/admin/Notice';
import type { AdminListRow } from '@/lib/admin/settings';
import { changePassword, removeAdmin, saveContactDetails, saveMyName } from '@/lib/admin/settings-actions';
import { SETTINGS_LIMITS, type ContactFormState, type NameFormState, type PasswordFormState } from '@/lib/admin/settings-form';
import { AddAdminDialog } from './AddAdminDialog';

interface SettingsViewProps {
  contact: { email: string; phone: string };
  admins: AdminListRow[];
  me: { id: string; name: string; email: string; temporaryPassword: boolean };
}

const SESSION_ENDED = 'Your session ended. Sign in again in another tab, then save.';
const TRY_AGAIN = 'That did not save. Try again in a moment.';

type Status = { status: string; attempt: number };

/**
 * A form that saves through an action and keeps what was typed when the answer is a problem. (A form `action` would
 * be reset by React once it finishes, wiping the fields the admin has to fix.) `done` hears every answer.
 */
function useSave<State extends Status>(action: (previous: State, form: FormData) => Promise<State>, done: (state: State, form: HTMLFormElement) => void) {
  const [state, setState] = useState<State>({ status: 'idle', attempt: 0 } as State);
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const next = await action(state, data);
      setState(next);
      done(next, form);
    });
  }
  return [state, submit, pending] as const;
}

/** The business's public contact details, who can use the admin, and the signed-in admin's own name and password. */
export function SettingsView({ contact, admins, me }: SettingsViewProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [adding, setAdding] = useState({ key: 0, open: false });
  const [removing, setRemoving] = useState<AdminListRow | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removePending, startRemove] = useTransition();
  const noticeId = useRef(0);
  const say = useCallback((next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current }), []);

  // Each save says how it went in the notice bar. Field problems show on the fields, and focus goes to the first.
  const focusFirstError = (form: HTMLFormElement) => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  const [contactState, saveContact, contactPending] = useSave<ContactFormState>(saveContactDetails, (state, form) => {
    if (state.status === 'saved') say({ tone: 'success', title: 'Saved the contact details', body: 'The footer shows them now.' });
    else if (state.status === 'invalid') requestAnimationFrame(() => focusFirstError(form));
    else say({ tone: 'danger', title: 'The contact details were not saved', body: state.status === 'signed-out' ? SESSION_ENDED : TRY_AGAIN });
  });
  const [nameState, saveName, namePending] = useSave<NameFormState>(saveMyName, (state, form) => {
    if (state.status === 'saved') say({ tone: 'success', title: 'Saved your name', body: 'The admin shows it now.' });
    else if (state.status === 'invalid') requestAnimationFrame(() => focusFirstError(form));
    else say({ tone: 'danger', title: 'Your name was not saved', body: state.status === 'signed-out' ? SESSION_ENDED : TRY_AGAIN });
  });
  const [passwordState, savePassword, passwordPending] = useSave<PasswordFormState>(changePassword, (state, form) => {
    if (state.status === 'saved') {
      form.reset();
      say({ tone: 'success', title: 'Changed your password', body: 'Use it the next time you sign in.' });
    } else if (state.status === 'invalid') requestAnimationFrame(() => focusFirstError(form));
    else if (state.status === 'limited') say({ tone: 'danger', title: 'Too many tries', body: 'Wait 15 minutes, then try again.' });
    else say({ tone: 'danger', title: 'Your password was not changed', body: state.status === 'signed-out' ? SESSION_ENDED : TRY_AGAIN });
  });

  function confirmRemove() {
    const admin = removing;
    if (!admin) return;
    startRemove(async () => {
      const result = await removeAdmin(admin.id);
      setRemoveOpen(false);
      if (result.ok) say({ tone: 'success', title: `Removed ${admin.name || admin.email}`, body: 'Their account no longer opens the admin.' });
      else if (result.reason === 'self') say({ tone: 'danger', title: 'You cannot remove yourself', body: 'Ask another admin to do it.' });
      else if (result.reason === 'last') say({ tone: 'danger', title: 'One admin has to remain', body: 'Add someone else first.' });
      else say(problemNotice(result.reason, 'admin'));
    });
  }

  const columns: Array<DataTableColumn<AdminListRow>> = [
    // Two lines a cell, so the list fits beside the other settings without scrolling sideways.
    {
      key: 'name',
      header: 'Admin',
      render: (row) => (
        <span className="admin-cell-stack">
          <span className="admin-cell-name">
            <strong>{row.name || row.email}</strong>
            {row.id === me.id ? <Badge tone="accent">You</Badge> : null}
          </span>
          {row.name ? <span className="admin-muted admin-cell-email">{row.email}</span> : null}
        </span>
      ),
    },
    {
      key: 'added',
      header: 'Added',
      render: (row) => (
        <span className="admin-cell-stack">
          <span className="admin-nowrap">{row.added}</span>
          <span className="admin-muted">{row.addedBy ? `By ${row.addedBy}` : 'Set up with the site'}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="fhd-sr">Actions</span>,
      align: 'right',
      render: (row) =>
        row.id === me.id ? null : (
          <Button
            size="sm"
            variant="ghost"
            icon="trash"
            aria-label={`Remove ${row.name || row.email} as an admin`}
            onClick={() => {
              setRemoving(row);
              setRemoveOpen(true);
            }}
          />
        ),
    },
  ];

  return (
    <>
      <AdminPageHead eyebrow="Account" title="Settings" />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />

      <div className="admin-detail">
        <div className="admin-detail__main">
          <Panel title="Contact details" description="Shown in the footer of every page. Leave one empty to hide it.">
            <form onSubmit={saveContact} className="admin-form" noValidate aria-busy={contactPending || undefined}>
              <div className="admin-form__pair">
                <TextField
                  name="email"
                  type="email"
                  label="Email"
                  autoComplete="off"
                  defaultValue={contact.email}
                  maxLength={SETTINGS_LIMITS.email}
                  error={contactState.errors?.email}
                />
                <TextField
                  name="phone"
                  type="tel"
                  label="Phone"
                  autoComplete="off"
                  defaultValue={contact.phone}
                  maxLength={SETTINGS_LIMITS.phone}
                  error={contactState.errors?.phone}
                />
              </div>
              <div className="row">
                <Button type="submit" variant="solid" iconLeft="check" loading={contactPending}>
                  Save contact details
                </Button>
              </div>
            </form>
          </Panel>

          <Panel
            flush
            title="Admins"
            description="Everyone who can sign in here. Signing up is closed, so only an admin can add one."
            actions={
              <Button size="sm" iconLeft="plus" onClick={() => setAdding((now) => ({ key: now.key + 1, open: true }))}>
                Add admin
              </Button>
            }
          >
            <DataTable caption="Admins" columns={columns} rows={admins} rowKey={(row) => row.id} />
          </Panel>
        </div>

        <div className="admin-detail__side">
          <Panel title="Download your data" description="Spreadsheet files (CSV) of everything recorded so far, with times in your time zone.">
            <div className="admin-downloads">
              <Button size="sm" iconLeft="download-simple" href={exportPath('inquiries')}>
                Inquiries
              </Button>
              <Button size="sm" iconLeft="download-simple" href={exportPath('clients')}>
                Clients
              </Button>
              <Button size="sm" iconLeft="download-simple" href={exportPath('orders')}>
                Orders
              </Button>
              <Button size="sm" iconLeft="download-simple" href={exportPath('marketing')}>
                Marketing list
              </Button>
            </div>
            <p className="admin-muted admin-note">
              The marketing list holds only clients who asked for marketing email and have not said no since. Keep these files private: they hold
              clients&apos; contact details.
            </p>
          </Panel>
          <Panel title="Your name" description={`Signed in as ${me.email}.`}>
            <form onSubmit={saveName} className="admin-form" noValidate aria-busy={namePending || undefined}>
              <TextField name="name" label="Name" autoComplete="name" defaultValue={me.name} maxLength={SETTINGS_LIMITS.name} error={nameState.errors?.name} />
              <div className="row">
                <Button type="submit" variant="solid" iconLeft="check" loading={namePending}>
                  Save name
                </Button>
              </div>
            </form>
          </Panel>

          <Panel id="password" title="Your password" description="At least 12 characters, with lower and upper case letters and a digit.">
            {me.temporaryPassword ? (
              <Alert tone="warning" title="Choose your own password">
                You signed in with a temporary password another admin gave you.
              </Alert>
            ) : null}
            <form onSubmit={savePassword} className="admin-form" noValidate aria-busy={passwordPending || undefined}>
              <input type="text" name="username" autoComplete="username" value={me.email} readOnly hidden />
              <TextField
                name="current"
                type="password"
                label="Current password"
                autoComplete="current-password"
                required
                error={passwordState.errors?.current}
              />
              <TextField name="next" type="password" label="New password" autoComplete="new-password" required error={passwordState.errors?.next} />
              <TextField
                name="confirm"
                type="password"
                label="New password again"
                autoComplete="new-password"
                required
                error={passwordState.errors?.confirm}
              />
              <div className="row">
                <Button type="submit" variant="solid" iconLeft="lock-simple" loading={passwordPending}>
                  Change password
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      </div>

      {adding.key > 0 ? (
        <AddAdminDialog key={adding.key} open={adding.open} onClose={() => setAdding((now) => ({ ...now, open: false }))} />
      ) : null}

      <Dialog
        open={removeOpen}
        onClose={() => (removePending ? undefined : setRemoveOpen(false))}
        size="sm"
        title="Remove this admin?"
        description={
          removing
            ? `${removing.name || removing.email} can no longer open the admin. Their account stays, so you can add them back later.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removePending}>
              Keep them
            </Button>
            <Button variant="danger" onClick={confirmRemove} loading={removePending}>
              Remove admin
            </Button>
          </>
        }
      />
    </>
  );
}
