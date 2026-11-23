'use client';

import { Alert, Button, Dialog, Tabs } from '@ds';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { NoticeBar, problemNotice, type Notice } from '@/components/admin/Notice';
import type { CopySlotRow, FaqRow, LastPublish } from '@/lib/admin/content';
import { discardCopyDrafts, publishSite, saveCopyDrafts } from '@/lib/admin/content-actions';
import { HEADLINE_KEY, HIGHLIGHT_KEY, slotProblem } from '@/lib/admin/copy-rules';
import { summarizeFaqs } from '@/lib/admin/faq-changes';
import { PREVIEW_PATH } from '@/lib/admin/paths';
import { CopyEditor, groupSlots } from './CopyEditor';
import { FaqEditor } from './FaqEditor';

export type ContentTab = 'copy' | 'faqs';

interface SiteContentViewProps {
  slots: CopySlotRow[];
  faqs: FaqRow[];
  lastPublish: LastPublish | null;
  initialTab: ContentTab;
}

const TABS_ID = 'content-tabs';
const plural = (count: number, one: string, other: string) => `${count} ${count === 1 ? one : other}`;

/**
 * Site content: the storefront's text and its FAQ, edited as drafts and published together. Page copy is edited in
 * place and saved with one button; FAQ changes save as they are made. Publish sends every saved draft live at once.
 */
export function SiteContentView({ slots, faqs, lastPublish, initialTab }: SiteContentViewProps) {
  const [tab, setTab] = useState<ContentTab>(initialTab);
  const pages = useMemo(() => groupSlots(slots), [slots]);
  const [page, setPage] = useState(pages[0]?.id ?? '');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [serverProblems, setServerProblems] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<'publish' | 'discard' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, startSave] = useTransition();
  const [working, startWork] = useTransition();
  const noticeId = useRef(0);
  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });

  const bySlot = useMemo(() => new Map(slots.map((slot) => [slot.key, slot])), [slots]);
  const unsaved = Object.keys(edits).filter((key) => bySlot.has(key) && edits[key] !== bySlot.get(key)!.draft);
  const values: Record<string, string> = Object.fromEntries(slots.map((slot) => [slot.key, edits[slot.key] ?? slot.draft]));

  // What is wrong with the text as it stands: checked as Ryan types, and again by the server on save.
  const problems: Record<string, string> = {};
  for (const key of unsaved) {
    const problem = slotProblem(bySlot.get(key)!, values[key], values);
    if (problem) problems[key] = problem;
  }
  if (unsaved.includes(HEADLINE_KEY) && bySlot.has(HIGHLIGHT_KEY) && !problems[HIGHLIGHT_KEY]) {
    const problem = slotProblem(bySlot.get(HIGHLIGHT_KEY)!, values[HIGHLIGHT_KEY], values);
    if (problem) problems[HIGHLIGHT_KEY] = problem;
  }
  for (const [key, problem] of Object.entries(serverProblems)) problems[key] ??= problem;

  const copyLive = slots.filter((slot) => slot.draft !== slot.published).length;
  const faqSummary = summarizeFaqs(faqs);
  const total = copyLive + faqSummary.pending;
  const blocked = faqSummary.blocking.size > 0;
  const canPublish = total > 0 && !unsaved.length && !blocked;

  const pageCounts: Record<string, number> = {};
  for (const item of pages) {
    pageCounts[item.id] = item.sections.flatMap((section) => section.slots).filter((slot) => (values[slot.key] ?? slot.draft) !== slot.published).length;
  }

  // Leaving with unsaved edits asks first.
  const dirty = unsaved.length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function chooseTab(id: string) {
    const next = id === 'faqs' ? 'faqs' : 'copy';
    setTab(next);
    window.history.replaceState(window.history.state, '', next === 'faqs' ? '?tab=faqs' : window.location.pathname);
  }

  function edit(key: string, text: string) {
    setEdits((now) => ({ ...now, [key]: text }));
    if (serverProblems[key])
      setServerProblems((now) => {
        const next = { ...now };
        delete next[key];
        return next;
      });
  }

  function showProblem(keys: string[]) {
    const first = slots.find((slot) => keys.includes(slot.key));
    if (!first) return;
    const pageId = pages.find((item) => item.label === first.page)?.id;
    if (pageId) setPage(pageId);
    setTab('copy');
    // Centred, so the message under the field is not hidden behind the save bar.
    requestAnimationFrame(() => {
      const field = document.querySelector<HTMLElement>('.content-copy [aria-invalid="true"]');
      field?.focus({ preventScroll: true });
      field?.closest('.fhd-content')?.scrollIntoView({ block: 'center' });
    });
  }

  function save() {
    if (Object.keys(problems).length) {
      say({ tone: 'danger', title: 'Fix the marked text first', body: 'Nothing was saved. Each field says what it needs.' });
      showProblem(Object.keys(problems));
      return;
    }
    const sent = Object.fromEntries(unsaved.map((key) => [key, edits[key]]));
    startSave(async () => {
      const result = await saveCopyDrafts(sent);
      if (result.ok) {
        // Keep anything typed while the save was on its way.
        setEdits((now) => Object.fromEntries(Object.entries(now).filter(([key, text]) => sent[key] !== text)));
        say({
          tone: 'success',
          title: `Saved ${plural(Object.keys(sent).length, 'draft', 'drafts')}`,
          body: 'Visitors see the new text once you publish.',
        });
      } else if (result.reason === 'invalid') {
        setServerProblems(result.problems);
        say({ tone: 'danger', title: 'Your edits were not saved', body: 'Nothing was saved. Fix the marked text, then save again.' });
        showProblem(Object.keys(result.problems));
      } else if (result.reason === 'signed-out') {
        say({ ...problemNotice('signed-out', 'text'), body: 'Your edits are still here. Sign in again in another tab, then save.' });
      } else {
        say({ tone: 'danger', title: 'Your edits were not saved', body: 'They are still here. Try saving again in a moment.' });
      }
    });
  }

  function ask(next: 'publish' | 'discard') {
    setConfirm(next);
    setConfirmOpen(true);
  }

  function confirmed() {
    const what = confirm;
    startWork(async () => {
      if (what === 'discard') {
        const result = await discardCopyDrafts();
        setConfirmOpen(false);
        if (!result.ok) return say(problemNotice(result.reason, 'text'));
        setEdits({});
        setServerProblems({});
        say({ tone: 'success', title: 'Discarded the page copy drafts', body: 'Every field matches the live site again. FAQ drafts are unchanged.' });
        return;
      }
      const result = await publishSite();
      setConfirmOpen(false);
      if (result.ok) {
        say({ tone: 'success', title: 'Published', body: 'Visitors see the new text and questions now.' });
      } else if (result.reason === 'incomplete') {
        say({
          tone: 'danger',
          title: 'Nothing was published',
          body: 'A live question has lost its question or answer. Fill it in, or restore the published wording, then publish again.',
        });
        setTab('faqs');
      } else if (result.reason === 'signed-out') {
        say({ ...problemNotice('signed-out', 'site'), body: 'Nothing was published. Your drafts are kept. Sign in again, then publish.' });
      } else {
        say({ tone: 'danger', title: 'Nothing was published', body: 'Your drafts are kept. Try again in a moment.' });
      }
    });
  }

  const breakdown = [copyLive ? plural(copyLive, 'text change', 'text changes') : '', faqSummary.pending ? plural(faqSummary.pending, 'FAQ change', 'FAQ changes') : '']
    .filter(Boolean)
    .join(' and ');

  return (
    <>
      <AdminPageHead
        eyebrow="Website"
        title="Site content"
        actions={
          <>
            <Button href={PREVIEW_PATH} newTab newTabLabel="(opens in a new tab)" iconRight="arrow-up-right">
              Preview site
            </Button>
            <Button variant="primary" iconLeft="upload-simple" disabled={!canPublish || saving} onClick={() => ask('publish')}>
              {total ? `Publish ${plural(total, 'change', 'changes')}` : 'Nothing to publish'}
            </Button>
          </>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />

      {/* What Publish would send. Edits not saved yet are the save bar's to report. */}
      {total ? (
        <Alert tone={blocked ? 'danger' : 'warning'} title={plural(total, 'unpublished change', 'unpublished changes')}>
          {[
            `Saved and waiting: ${breakdown}. Visitors see the published site until you publish.`,
            blocked ? 'A live question has lost its question or answer. Fill it in or restore the published wording before you publish.' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        </Alert>
      ) : (
        <Alert tone="success" title="Everything is published">
          {`Visitors see exactly what is saved here.${lastPublish ? ` Last published ${lastPublish.when} by ${lastPublish.by}.` : ''}`}
        </Alert>
      )}

      <div className="admin-tabs">
        <Tabs
          items={[
            { id: 'copy', label: 'Page copy', count: Object.values(pageCounts).reduce((sum, count) => sum + count, 0) || undefined },
            { id: 'faqs', label: 'FAQs', count: faqSummary.pending || undefined },
          ]}
          value={tab}
          onChange={chooseTab}
          ariaLabel="Site content"
          panelId={TABS_ID}
        />
      </div>
      <section id={TABS_ID} role="tabpanel" aria-labelledby={`${TABS_ID}-tab-${tab}`} className="content-panel">
        {tab === 'copy' ? (
          <>
            {copyLive ? (
              <div className="content-toolbar">
                <p className="admin-muted body-sm">{`${plural(copyLive, 'saved text draft is', 'saved text drafts are')} not live yet.`}</p>
                <Button size="sm" variant="ghost" iconLeft="arrows-clockwise" onClick={() => ask('discard')} disabled={saving || working}>
                  Discard text drafts
                </Button>
              </div>
            ) : null}
            <CopyEditor pages={pages} page={page} onPage={setPage} values={values} onEdit={edit} problems={problems} counts={pageCounts} disabled={saving} />
          </>
        ) : (
          <FaqEditor faqs={faqs} summary={faqSummary} say={say} />
        )}
      </section>

      {dirty ? (
        <div className="content-savebar" role="region" aria-label="Unsaved edits">
          <p className="body-sm">
            <strong>{plural(unsaved.length, 'unsaved edit', 'unsaved edits')}</strong> to the page copy. Save to include{' '}
            {unsaved.length === 1 ? 'it' : 'them'} in Publish.
          </p>
          <div className="row">
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setEdits({});
                setServerProblems({});
              }}
            >
              Undo edits
            </Button>
            <Button variant="solid" iconLeft="check" loading={saving} onClick={save}>
              Save drafts
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={confirmOpen}
        onClose={() => (working ? undefined : setConfirmOpen(false))}
        size="sm"
        title={confirm === 'discard' ? 'Discard the text drafts?' : `Publish ${plural(total, 'change', 'changes')}?`}
        description={
          confirm === 'discard'
            ? `${plural(copyLive, 'saved text draft goes', 'saved text drafts go')} back to what visitors see now. FAQ drafts are not touched.`
            : `This publishes ${breakdown || 'nothing'}, page copy and FAQs together. Visitors see the new version right away.`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button variant={confirm === 'discard' ? 'danger' : 'primary'} onClick={confirmed} loading={working}>
              {confirm === 'discard' ? 'Discard drafts' : 'Publish'}
            </Button>
          </>
        }
      />
    </>
  );
}
