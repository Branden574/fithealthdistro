'use client';

import { ContentField, Panel, Tabs } from '@ds';
import type { CopySlotRow } from '@/lib/admin/content';

export interface CopyPage {
  id: string;
  label: string;
  sections: Array<{ name: string; slots: CopySlotRow[] }>;
}

/** The slots grouped as the site is: pages in the order they appear in site-copy.json, then sections within each. */
export function groupSlots(slots: readonly CopySlotRow[]): CopyPage[] {
  const pages: CopyPage[] = [];
  for (const slot of slots) {
    const id = slot.page.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let page = pages.find((item) => item.id === id);
    if (!page) pages.push((page = { id, label: slot.page, sections: [] }));
    let section = page.sections.find((item) => item.name === slot.section);
    if (!section) page.sections.push((section = { name: slot.section, slots: [] }));
    section.slots.push(slot);
  }
  return pages;
}

interface CopyEditorProps {
  pages: CopyPage[];
  page: string;
  onPage: (id: string) => void;
  /** The text in each field: the unsaved edit, or else the saved draft. */
  values: Readonly<Record<string, string>>;
  onEdit: (key: string, text: string) => void;
  /** Why a field's text cannot be saved. */
  problems: Readonly<Record<string, string>>;
  /** How many slots on each page differ from the live site, saved or not. */
  counts: Readonly<Record<string, number>>;
  disabled?: boolean;
}

const PANEL_ID = 'copy-pages';

/** Every storefront text slot, a page at a time. Each field shows whether it differs from the live site and the original. */
export function CopyEditor({ pages, page, onPage, values, onEdit, problems, counts, disabled }: CopyEditorProps) {
  const current = pages.find((item) => item.id === page) ?? pages[0];
  if (!current) return null;
  return (
    <div className="content-copy">
      <div className="admin-tabs">
        <Tabs
          items={pages.map((item) => ({ id: item.id, label: item.label, count: counts[item.id] || undefined }))}
          value={current.id}
          onChange={onPage}
          ariaLabel="Pages of the site"
          panelId={PANEL_ID}
        />
      </div>
      <div id={PANEL_ID} role="tabpanel" aria-labelledby={`${PANEL_ID}-tab-${current.id}`} className="content-copy__page">
        {current.sections.map((section) => (
          <Panel key={section.name} title={section.name}>
            <div className="content-grid">
              {section.slots.map((slot) => (
                <ContentField
                  key={slot.key}
                  className={slot.multiline ? 'content-grid__wide' : undefined}
                  label={slot.label}
                  value={values[slot.key] ?? slot.draft}
                  onChange={(text) => onEdit(slot.key, text)}
                  original={slot.original}
                  published={slot.published}
                  multiline={slot.multiline}
                  rows={slot.max > 600 ? 8 : slot.multiline ? 3 : undefined}
                  maxLength={slot.max}
                  hint={slot.hint || undefined}
                  error={problems[slot.key]}
                  disabled={disabled}
                />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
