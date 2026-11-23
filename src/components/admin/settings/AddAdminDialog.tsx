'use client';

import { Alert, Button, Dialog, TextField } from '@ds';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { addAdmin } from '@/lib/admin/settings-actions';
import { SETTINGS_LIMITS, type AddAdminState } from '@/lib/admin/settings-form';

const INITIAL: AddAdminState = { status: 'idle', attempt: 0 };

const PROBLEM: Partial<Record<AddAdminState['status'], { title: string; body: string }>> = {
  'signed-out': { title: 'Your session ended', body: 'Sign in again in another tab, then add them.' },
  error: { title: 'They were not added', body: 'Nothing was changed. Try again in a moment.' },
};

/**
 * Adds an admin. For someone with no account yet it shows the temporary password once, for the admin to pass on
 * privately. Closing the dialog is the only way it goes away; it is never shown again.
 */
export function AddAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<AddAdminState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const problem = PROBLEM[state.status];
  const added = state.status === 'added';

  useEffect(() => {
    if (state.status === 'invalid') formRef.current?.querySelector<HTMLElement>(state.errors?.name ? '[name="name"]' : '[name="email"]')?.focus();
    else if (PROBLEM[state.status]) problemRef.current?.focus();
    else if (state.status === 'added') doneRef.current?.focus();
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => setState(await addAdmin(state, data)));
  }

  async function copy() {
    if (!state.password) return;
    try {
      await navigator.clipboard.writeText(state.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="md"
      title={added ? `Added ${state.name}` : 'Add admin'}
      description={
        added
          ? undefined
          : 'They can do everything you can here: edit the catalog and the site, and read every inquiry. Add only people the business trusts with client details.'
      }
      footer={
        added ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="add-admin-form" variant="primary" loading={pending}>
              Add admin
            </Button>
          </>
        )
      }
    >
      {added ? (
        <div ref={doneRef} tabIndex={-1} className="admin-stack add-admin__done">
          {state.password ? (
            <>
              <p className="admin-note">
                An account was made for <strong>{state.email}</strong>. Give them this temporary password privately, such as in person or by phone. They are
                asked to choose their own once they sign in.
              </p>
              <div className="add-admin__password">
                <code className="data" aria-label="Temporary password">
                  {state.password}
                </code>
                <Button size="sm" iconLeft={copied ? 'check' : 'copy-simple'} onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Alert tone="warning" title="It shows only this once">
                Close this and it cannot be shown again. If it is lost, remove them and add them again.
              </Alert>
            </>
          ) : (
            <p className="admin-note">
              <strong>{state.email}</strong> already has an account. They sign in with their own password, at the admin sign-in page.
            </p>
          )}
        </div>
      ) : (
        <form ref={formRef} id="add-admin-form" className="admin-form" onSubmit={submit} noValidate aria-busy={pending || undefined}>
          {problem ? (
            <div ref={problemRef} tabIndex={-1}>
              <Alert tone="danger" className="fhd-appear" title={problem.title}>
                {problem.body}
              </Alert>
            </div>
          ) : null}
          <TextField name="name" label="Name" autoComplete="off" required maxLength={SETTINGS_LIMITS.name} error={state.errors?.name} />
          <TextField
            name="email"
            type="email"
            label="Email"
            autoComplete="off"
            required
            maxLength={SETTINGS_LIMITS.email}
            hint="The address they will sign in with."
            error={state.errors?.email}
          />
        </form>
      )}
    </Dialog>
  );
}
