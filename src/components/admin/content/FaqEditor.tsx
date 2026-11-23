'use client';

import { Badge, Button, Dialog, EmptyState, Panel, Switch } from '@ds';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { problemNotice, type Notice } from '@/components/admin/Notice';
import { announce } from '@/lib/a11y/announce';
import type { FaqRow } from '@/lib/admin/content';
import { keepFaq, moveFaq, removeFaq, setFaqVisible, type FaqFormState } from '@/lib/admin/content-actions';
import { isComplete, type FaqSummary } from '@/lib/admin/faq-changes';
import { FaqDialog } from './FaqDialog';

interface FaqEditorProps {
  faqs: FaqRow[];
  summary: FaqSummary;
  say: (notice: Omit<Notice, 'id'>) => void;
}

type Change = { kind: 'move'; id: string; direction: 'up' | 'down' } | { kind: 'visible'; id: string; visible: boolean };

function apply(rows: FaqRow[], change: Change): FaqRow[] {
  if (change.kind === 'visible') return rows.map((row) => (row.id === change.id ? { ...row, visible: change.visible } : row));
  const at = rows.findIndex((row) => row.id === change.id);
  const to = change.direction === 'up' ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  [next[at], next[to]] = [next[to], next[at]];
  return next;
}

const snippet = (text: string) => (text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text);

/**
 * The FAQ as it will be after the next publish: add, edit, reorder, hide and remove questions. Each row says whether it
 * is live, a draft, or live with changes waiting. Nothing here reaches visitors until the site is published.
 */
export function FaqEditor({ faqs, summary, say }: FaqEditorProps) {
  const router = useRouter();
  const [rows, change] = useOptimistic(faqs, apply);
  const [, startChange] = useTransition();
  const [dialog, setDialog] = useState<{ key: number; open: boolean; faq: FaqRow | null }>({ key: 0, open: false, faq: null });
  const [removing, setRemoving] = useState<FaqRow | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removePending, startRemove] = useTransition();
  // After a move, focus stays on the button that was pressed, or its partner once that one reaches the end.
  const refocus = useRef<{ id: string; direction: 'up' | 'down' } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const target = refocus.current;
    if (!target || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(`[data-faq="${target.id}"]`);
    const pressed = item?.querySelector<HTMLButtonElement>(`[data-move="${target.direction}"]`);
    const other = item?.querySelector<HTMLButtonElement>(`[data-move="${target.direction === 'up' ? 'down' : 'up'}"]`);
    const next = pressed && !pressed.disabled ? pressed : other;
    if (next && document.activeElement !== next) next.focus();
    refocus.current = null;
  }, [rows]);

  function failed(reason: 'signed-out' | 'missing' | 'error') {
    say(problemNotice(reason, 'question'));
    if (reason === 'missing') router.refresh();
  }

  function move(row: FaqRow, direction: 'up' | 'down') {
    refocus.current = { id: row.id, direction };
    // Focus stays put, so the new place is said aloud. A failed move says so in the notice bar.
    const at = rows.findIndex((item) => item.id === row.id) + (direction === 'up' ? 0 : 2);
    announce(`Moved to position ${at} of ${rows.length}.`);
    startChange(async () => {
      change({ kind: 'move', id: row.id, direction });
      const result = await moveFaq(row.id, direction);
      if (!result.ok) failed(result.reason);
    });
  }

  function toggle(row: FaqRow, visible: boolean) {
    startChange(async () => {
      change({ kind: 'visible', id: row.id, visible });
      const result = await setFaqVisible(row.id, visible);
      if (!result.ok) failed(result.reason);
      else
        say({
          tone: 'success',
          title: visible ? 'Set to show' : 'Set to hide',
          body: `“${snippet(row.question)}” ${visible ? 'shows' : 'is hidden'} on the site once you publish.`,
        });
    });
  }

  function keep(row: FaqRow) {
    startChange(async () => {
      const result = await keepFaq(row.id);
      if (!result.ok) failed(result.reason);
      else say({ tone: 'success', title: 'Kept the question', body: 'It is no longer marked for removal.' });
    });
  }

  function askRemove(row: FaqRow) {
    setDialog((now) => ({ ...now, open: false }));
    setRemoving(row);
    setRemoveOpen(true);
  }

  function confirmRemove() {
    const row = removing;
    if (!row) return;
    startRemove(async () => {
      const result = await removeFaq(row.id);
      setRemoveOpen(false);
      if (!result.ok) return failed(result.reason);
      say(
        result.staged
          ? { tone: 'success', title: 'Marked for removal', body: 'Visitors still see it until you publish. Keep it before then to change your mind.' }
          : { tone: 'success', title: 'Deleted the draft', body: 'It was never published, so nothing changes on the site.' },
      );
    });
  }

  function saved(result: FaqFormState) {
    setDialog((now) => ({ ...now, open: false }));
    say({
      tone: 'success',
      title: result.isNew ? 'Added the question' : 'Saved the question',
      body: 'It is a draft. Visitors see it once you publish the site.',
    });
  }

  const open = (faq: FaqRow | null) => setDialog((now) => ({ key: now.key + 1, open: true, faq }));

  return (
    <>
      <Panel
        title="Questions"
        description="In the order visitors see them. Every change here waits for Publish, so the live FAQ stays as it is."
        actions={
          <Button iconLeft="plus" onClick={() => open(null)}>
            Add question
          </Button>
        }
        footer={
          summary.unfinished
            ? `${summary.unfinished} ${summary.unfinished === 1 ? 'question needs' : 'questions need'} an answer before ${summary.unfinished === 1 ? 'it goes' : 'they go'} live.`
            : undefined
        }
      >
        {rows.length ? (
          <ol ref={listRef} className="faq-list">
            {rows.map((row, index) => {
              const live = row.isPublished;
              const label = row.question || 'Untitled question';
              return (
                <li key={row.id} data-faq={row.id} className={row.pendingRemoval ? 'faq-row faq-row--removing' : 'faq-row'}>
                  <span className="faq-row__number data" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="faq-row__body">
                    <p className="faq-row__question title">{label}</p>
                    <p className="faq-row__answer body-sm">{row.answer ? snippet(row.answer) : <span className="admin-muted">No answer yet</span>}</p>
                    <div className="faq-row__badges">
                      {row.pendingRemoval ? (
                        <Badge tone="danger">Removed at publish</Badge>
                      ) : summary.blocking.has(row.id) ? (
                        <Badge tone="danger">Needs an answer to publish</Badge>
                      ) : !live ? (
                        isComplete(row) ? (
                          <Badge tone="warning" dot>
                            New, unpublished
                          </Badge>
                        ) : (
                          <Badge>Draft, needs an answer</Badge>
                        )
                      ) : row.status === 'changed' || summary.moved.has(row.id) ? (
                        <Badge tone="warning" dot>
                          Unpublished changes
                        </Badge>
                      ) : (
                        <Badge tone="success">Published</Badge>
                      )}
                      {!row.pendingRemoval && summary.moved.has(row.id) ? <Badge>Moved</Badge> : null}
                      {!row.pendingRemoval && !row.visible ? <Badge>Hidden</Badge> : null}
                      {row.isStarter && !row.answer ? <Badge tone="info">Example question</Badge> : null}
                    </div>
                  </div>
                  <div className="faq-row__tools">
                    {row.pendingRemoval ? (
                      <Button size="sm" iconLeft="arrows-clockwise" onClick={() => keep(row)}>
                        Keep it
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="caret-up"
                          data-move="up"
                          aria-label={`Move “${label}” up`}
                          disabled={index === 0}
                          onClick={() => move(row, 'up')}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="caret-down"
                          data-move="down"
                          aria-label={`Move “${label}” down`}
                          disabled={index === rows.length - 1}
                          onClick={() => move(row, 'down')}
                        />
                        <Switch
                          className="faq-row__show"
                          label={
                            <>
                              Show<span className="fhd-sr">{` “${label}” on the site`}</span>
                            </>
                          }
                          checked={row.visible}
                          onChange={(event) => toggle(row, event.currentTarget.checked)}
                        />
                        <Button size="sm" variant="ghost" icon="pencil-simple" aria-label={`Edit “${label}”`} onClick={() => open(row)} />
                        <Button size="sm" variant="ghost" icon="trash" aria-label={`Remove “${label}”`} onClick={() => askRemove(row)} />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            compact
            icon="question"
            title="No questions yet"
            description="Add the questions clients ask most, with answers the business has approved."
            action={
              <Button size="sm" iconLeft="plus" onClick={() => open(null)}>
                Add question
              </Button>
            }
          />
        )}
      </Panel>

      {dialog.key > 0 ? (
        <FaqDialog
          key={dialog.key}
          open={dialog.open}
          faq={dialog.faq}
          onClose={() => setDialog((now) => ({ ...now, open: false }))}
          onSaved={saved}
          onDiscard={askRemove}
        />
      ) : null}

      <Dialog
        open={removeOpen}
        onClose={() => (removePending ? undefined : setRemoveOpen(false))}
        size="sm"
        title={removing?.isPublished ? 'Remove this question?' : 'Delete this draft?'}
        description={
          removing?.isPublished
            ? 'It stays on the site until you publish, then it is gone. Until then you can keep it.'
            : 'It was never published, so it is deleted now and the site does not change.'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removePending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmRemove} loading={removePending}>
              {removing?.isPublished ? 'Remove question' : 'Delete draft'}
            </Button>
          </>
        }
      />
    </>
  );
}
