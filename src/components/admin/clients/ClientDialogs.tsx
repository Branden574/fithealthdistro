'use client';

import { Alert, Button, Dialog, TextField } from '@ds';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import type { AdminClient } from '@/lib/admin/clients';
import { recordActivity, saveClient } from '@/lib/admin/client-actions';
import { CLIENT_LIMITS, INITIAL_CLIENT_STATE, type ClientFormState, type RecordedKind } from '@/lib/admin/client-form';

const PROBLEM: Partial<Record<ClientFormState['status'], { title: string; body: string }>> = {
  'signed-out': { title: 'Your session ended', body: 'Sign in again in another tab, then save.' },
  missing: { title: 'This client is gone', body: 'They were removed elsewhere. Close this form.' },
  error: { title: 'That did not save', body: 'Nothing was changed. Try again in a moment.' },
};

type Action = (previous: ClientFormState, form: FormData) => Promise<ClientFormState>;

/** A dialog form that saves through a client action: problems at the top, field errors in place, focus where it helps. */
function useClientForm(action: Action, onSaved: () => void, fieldOrder: ReadonlyArray<keyof NonNullable<ClientFormState['errors']>>) {
  const [state, setState] = useState<ClientFormState>(INITIAL_CLIENT_STATE);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'invalid') {
      const first = fieldOrder.find((field) => state.errors?.[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else if (PROBLEM[state.status]) problemRef.current?.focus();
  }, [state, fieldOrder]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(state, data);
      if (result.status === 'saved') onSaved();
      else setState(result);
    });
  }

  const problem = PROBLEM[state.status];
  const alert = problem ? (
    <div ref={problemRef} tabIndex={-1}>
      <Alert tone="danger" className="fhd-appear" title={problem.title}>
        {problem.body}
      </Alert>
    </div>
  ) : null;
  return { state, pending, formRef, submit, alert };
}

const CLIENT_FIELDS = ['name', 'company', 'phone'] as const;
const ACTIVITY_FIELDS = ['day', 'amount', 'note'] as const;

interface EditClientDialogProps {
  open: boolean;
  client: AdminClient;
  onClose: () => void;
  onSaved: () => void;
}

/** Corrects how a client is named and reached. The email stays: it is how their inquiries find them. */
export function EditClientDialog({ open, client, onClose, onSaved }: EditClientDialogProps) {
  const { state, pending, formRef, submit, alert } = useClientForm(saveClient, onSaved, CLIENT_FIELDS);
  const formId = `client-form-${client.id}`;
  return (
    <Dialog
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="md"
      title="Edit contact details"
      description={`Their email, ${client.email}, stays as they typed it: it is how their inquiries find them. Later inquiries leave these details as you set them.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={pending}>
            Save changes
          </Button>
        </>
      }
    >
      <form ref={formRef} id={formId} className="admin-form" onSubmit={submit} noValidate aria-busy={pending || undefined}>
        {alert}
        <input type="hidden" name="id" value={client.id} />
        <TextField name="name" label="Name" required autoComplete="off" maxLength={CLIENT_LIMITS.name} defaultValue={client.name} error={state.errors?.name} />
        <div className="admin-form__pair">
          <TextField name="company" label="Company" autoComplete="off" maxLength={CLIENT_LIMITS.company} defaultValue={client.company} hint="Optional." error={state.errors?.company} />
          <TextField name="phone" type="tel" label="Phone" autoComplete="off" maxLength={CLIENT_LIMITS.phone} defaultValue={client.phone} hint="Optional." error={state.errors?.phone} />
        </div>
      </form>
    </Dialog>
  );
}

interface RecordActivityDialogProps {
  open: boolean;
  client: AdminClient;
  /** A call or a visit, or an order with its total. */
  kind: RecordedKind;
  /** The admin's calendar day: the latest day the form takes. */
  today: string;
  onClose: () => void;
  onSaved: () => void;
}

const RECORD_TEXT: Record<RecordedKind, { title: string; description: (name: string) => string; placeholder: string }> = {
  manual: {
    title: 'Record activity',
    description: (name) => `A call or a visit with ${name}. It counts toward retention, the same as an inquiry.`,
    placeholder: 'Called about a second machine',
  },
  order: {
    title: 'Record order',
    description: (name) => `An order ${name} placed by phone, email or in person. It counts toward sales, conversion and retention.`,
    placeholder: 'Two combo machines for the lobby',
  },
};

/** Records something a client did away from the website, or an order they placed, on the day it happened. */
export function RecordActivityDialog({ open, client, kind, today, onClose, onSaved }: RecordActivityDialogProps) {
  const { state, pending, formRef, submit, alert } = useClientForm(recordActivity, onSaved, ACTIVITY_FIELDS);
  const formId = `${kind}-form-${client.id}`;
  const text = RECORD_TEXT[kind];
  return (
    <Dialog
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="md"
      title={text.title}
      description={text.description(client.name)}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={pending}>
            {text.title}
          </Button>
        </>
      }
    >
      <form ref={formRef} id={formId} className="admin-form" onSubmit={submit} noValidate aria-busy={pending || undefined}>
        {alert}
        <input type="hidden" name="client_id" value={client.id} />
        <input type="hidden" name="kind" value={kind} />
        <TextField name="day" type="date" label="Day" required max={today} min="2000-01-01" defaultValue={today} error={state.errors?.day} />
        {kind === 'order' ? (
          <TextField
            name="amount"
            label="Order total"
            required
            inputMode="decimal"
            autoComplete="off"
            prefix="$"
            placeholder="1250.00"
            hint="In dollars. It counts toward sales on the dashboard."
            error={state.errors?.amount}
          />
        ) : null}
        <TextField
          name="note"
          label="Note"
          autoComplete="off"
          maxLength={CLIENT_LIMITS.note}
          placeholder={text.placeholder}
          hint="Optional. One line, for whoever reads this later."
          error={state.errors?.note}
        />
      </form>
    </Dialog>
  );
}
