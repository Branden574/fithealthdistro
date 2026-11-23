'use client';

import { Alert, Button, Checkbox, Dialog, TextField } from '@ds';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import type { FaqRow } from '@/lib/admin/content';
import { saveFaq, type FaqFormState } from '@/lib/admin/content-actions';
import { FAQ_LIMITS } from '@/lib/admin/faq-changes';

const INITIAL: FaqFormState = { status: 'idle', attempt: 0 };

const PROBLEM: Partial<Record<FaqFormState['status'], { title: string; body: string }>> = {
  'signed-out': { title: 'Your session ended', body: 'Sign in again in another tab, then save. What you wrote is still here.' },
  missing: { title: 'This question is gone', body: 'It was removed elsewhere, or marked for removal. Close this form.' },
  error: { title: 'That did not save', body: 'What you wrote is still here. Try again in a moment.' },
};

interface FaqDialogProps {
  open: boolean;
  /** The entry being edited, or null to add one. */
  faq: FaqRow | null;
  onClose: () => void;
  onSaved: (state: FaqFormState) => void;
  /** For a draft that never went live: removes it, after the usual confirmation. */
  onDiscard: (faq: FaqRow) => void;
}

/** Adds a question or edits one. Saving keeps it a draft; the storefront changes only when the site is published. */
export function FaqDialog({ open, faq, onClose, onSaved, onDiscard }: FaqDialogProps) {
  const [state, setState] = useState<FaqFormState>(INITIAL);
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [visible, setVisible] = useState(faq?.visible ?? true);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const formId = `faq-form-${faq?.id ?? 'new'}`;
  const problem = PROBLEM[state.status];

  useEffect(() => {
    if (state.status === 'invalid') formRef.current?.querySelector<HTMLElement>(state.errors?.question ? '[name="question"]' : '[name="answer"]')?.focus();
    else if (PROBLEM[state.status]) problemRef.current?.focus();
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveFaq(state, data);
      if (result.status === 'saved') onSaved(result);
      else setState(result);
    });
  }

  const changedFromLive =
    faq?.isPublished &&
    (question !== (faq.publishedQuestion ?? '') || answer !== (faq.publishedAnswer ?? '') || visible !== (faq.publishedVisible ?? true));
  const hasOriginal = faq && faq.originalQuestion != null && faq.originalAnswer != null;
  const fromOriginal = hasOriginal && (question !== faq.originalQuestion || answer !== faq.originalAnswer);
  const questionOver = question.trim().length > FAQ_LIMITS.question;
  const answerOver = answer.trim().length > FAQ_LIMITS.answer;

  return (
    <Dialog
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="lg"
      title={faq ? 'Edit question' : 'Add question'}
      description={
        faq?.isPublished
          ? 'Visitors keep seeing the published wording until you publish the site.'
          : 'It stays a draft until you publish the site. A question goes live only once it has an answer.'
      }
      footer={
        <>
          {faq?.isPublished && changedFromLive ? (
            <Button
              variant="ghost"
              iconLeft="arrows-clockwise"
              disabled={pending}
              onClick={() => {
                setQuestion(faq.publishedQuestion ?? '');
                setAnswer(faq.publishedAnswer ?? '');
                setVisible(faq.publishedVisible ?? true);
              }}
            >
              Restore published
            </Button>
          ) : null}
          {hasOriginal && fromOriginal ? (
            <Button
              variant="ghost"
              iconLeft="arrows-clockwise"
              disabled={pending}
              onClick={() => {
                setQuestion(faq.originalQuestion ?? '');
                setAnswer(faq.originalAnswer ?? '');
              }}
            >
              Restore original
            </Button>
          ) : null}
          {faq && !faq.isPublished ? (
            <Button variant="ghost" iconLeft="trash" disabled={pending} onClick={() => onDiscard(faq)}>
              Discard draft
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={pending}>
            Save draft
          </Button>
        </>
      }
    >
      <form ref={formRef} id={formId} className="admin-form" onSubmit={submit} noValidate aria-busy={pending || undefined}>
        {problem ? (
          <div ref={problemRef} tabIndex={-1}>
            <Alert tone="danger" className="fhd-appear" title={problem.title}>
              {problem.body}
            </Alert>
          </div>
        ) : null}
        {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
        <TextField
          name="question"
          label="Question"
          required
          autoComplete="off"
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
          hint={<span className={questionOver ? 'content-count content-count--over' : 'content-count'}>{`${question.trim().length} / ${FAQ_LIMITS.question}`}</span>}
          error={state.errors?.question ?? (questionOver ? `Keep the question to ${FAQ_LIMITS.question} characters.` : undefined)}
        />
        <TextField
          name="answer"
          label="Answer"
          multiline
          rows={8}
          value={answer}
          onChange={(event) => setAnswer(event.currentTarget.value)}
          hint={
            <>
              Plain text. Leave a blank line between paragraphs. Write only what the business has approved.{' '}
              <span className={answerOver ? 'content-count content-count--over' : 'content-count'}>{`${answer.trim().length} / ${FAQ_LIMITS.answer}`}</span>
            </>
          }
          error={state.errors?.answer ?? (answerOver ? `Keep the answer to ${FAQ_LIMITS.answer} characters.` : undefined)}
        />
        <Checkbox
          name="visible"
          label="Show on the site"
          hint="Hidden questions stay here, ready to show later."
          checked={visible}
          onChange={(event) => setVisible(event.currentTarget.checked)}
        />
      </form>
    </Dialog>
  );
}
