'use client';

import { Alert, Button, DataTable, Dialog, EmptyState, Icon, Panel, Select, TextField, type DataTableColumn } from '@ds';
import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { NoticeBar, type Notice } from '@/components/admin/Notice';
import type { AdminCategory } from '@/lib/admin/catalog';
import { saveCategory } from '@/lib/admin/catalog-actions';
import { CATEGORY_ICON_LABELS, CATEGORY_ICONS, CATEGORY_NAME_MAX, INITIAL_CATEGORY_STATE, type CategoryFormState } from '@/lib/admin/category-form';

interface DialogState {
  key: number;
  open: boolean;
  category: AdminCategory | null;
}

/** The categories page: the list in storefront order, and a dialog to add one or rename one. */
export function CategoriesView({ categories }: { categories: AdminCategory[] }) {
  const [dialog, setDialog] = useState<DialogState>({ key: 0, open: false, category: null });
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeId = useRef(0);

  function open(category: AdminCategory | null) {
    setDialog((now) => ({ key: now.key + 1, open: true, category }));
  }

  function saved(result: CategoryFormState) {
    setDialog((now) => ({ ...now, open: false }));
    setNotice({
      id: ++noticeId.current,
      tone: 'success',
      title: result.isNew ? `Added ${result.name}` : `Saved ${result.name}`,
      body: result.isNew ? 'It shows on the storefront once it has a product in the catalog.' : 'The storefront shows the new name now.',
    });
  }

  const columns: Array<DataTableColumn<AdminCategory>> = [
    {
      key: 'name',
      header: 'Category',
      minWidth: 220,
      render: (row) => (
        <span className="admin-cell-name">
          <Icon name={row.icon} size={20} />
          <strong>{row.name}</strong>
        </span>
      ),
    },
    { key: 'slug', header: 'Link', mono: true, nowrap: true, render: (row) => `/?category=${row.slug}` },
    { key: 'productCount', header: 'Products', mono: true, align: 'right' },
    { key: 'visibleCount', header: 'In catalog', mono: true, align: 'right' },
    {
      key: 'actions',
      header: <span className="fhd-sr">Actions</span>,
      align: 'right',
      render: (row) => <Button size="sm" variant="ghost" icon="pencil-simple" aria-label={`Rename ${row.name}`} onClick={() => open(row)} />,
    },
  ];

  return (
    <>
      <AdminPageHead
        eyebrow="Catalog"
        title="Categories"
        actions={
          <Button variant="primary" iconLeft="plus" onClick={() => open(null)}>
            Add category
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <Panel
        flush
        title="Categories"
        description="The filters on the storefront, in this order. A category shows there once it has a product in the catalog."
      >
        <DataTable
          caption="Categories"
          columns={columns}
          rows={categories}
          rowKey={(row) => row.id}
          empty={<EmptyState compact icon="tag" title="No categories yet" description="Add one to start the catalog." />}
        />
      </Panel>
      {dialog.key > 0 ? (
        <CategoryDialog
          key={dialog.key}
          open={dialog.open}
          category={dialog.category}
          onClose={() => setDialog((now) => ({ ...now, open: false }))}
          onSaved={saved}
        />
      ) : null}
    </>
  );
}

const PROBLEM: Partial<Record<CategoryFormState['status'], { title: string; body: string }>> = {
  'signed-out': { title: 'Your session ended', body: 'Sign in again in another tab, then save.' },
  missing: { title: 'This category is gone', body: 'It was removed elsewhere. Close this form.' },
  error: { title: 'That did not save', body: 'Nothing was changed. Try again in a moment.' },
};

interface CategoryDialogProps {
  open: boolean;
  category: AdminCategory | null;
  onClose: () => void;
  onSaved: (state: CategoryFormState) => void;
}

function CategoryDialog({ open, category, onClose, onSaved }: CategoryDialogProps) {
  const [state, setState] = useState<CategoryFormState>(INITIAL_CATEGORY_STATE);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const formId = `category-form-${category?.id ?? 'new'}`;
  const problem = PROBLEM[state.status];

  useEffect(() => {
    if (state.status === 'invalid') formRef.current?.querySelector<HTMLElement>(state.errors?.name ? '[name="name"]' : '[name="icon"]')?.focus();
    else if (PROBLEM[state.status]) problemRef.current?.focus();
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCategory(state, data);
      if (result.status === 'saved') onSaved(result);
      else setState(result);
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => (pending ? undefined : onClose())}
      size="md"
      title={category ? 'Rename category' : 'Add category'}
      description={
        category
          ? 'Its link stays the same, so filtered links people have saved keep working.'
          : 'It goes last in the list, and shows on the storefront once it has a product in the catalog.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={pending}>
            {category ? 'Save changes' : 'Add category'}
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
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <TextField name="name" label="Name" required maxLength={CATEGORY_NAME_MAX} defaultValue={category?.name} error={state.errors?.name} />
        <Select
          name="icon"
          label="Icon"
          required
          options={CATEGORY_ICONS.map((icon) => ({ value: icon, label: CATEGORY_ICON_LABELS[icon] }))}
          defaultValue={category?.icon ?? 'package'}
          hint="Shown beside the category on the storefront."
          error={state.errors?.icon}
        />
      </form>
    </Dialog>
  );
}
