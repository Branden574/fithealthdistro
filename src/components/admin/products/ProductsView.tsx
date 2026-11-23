'use client';

import { Badge, Button, DataTable, Dialog, EmptyState, Panel, Select, Switch, Tabs, type DataTableColumn, type DataTableSort } from '@ds';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { NoticeBar, problemNotice, type Notice } from '@/components/admin/Notice';
import type { AdminCategory, AdminProduct } from '@/lib/admin/catalog';
import { removeProduct, setProductVisible } from '@/lib/admin/catalog-actions';
import { STOCK_OPTIONS, type ProductFormState } from '@/lib/admin/product-form';
import { ProductDialog } from './ProductDialog';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const PANEL_ID = 'product-views';
const ALL = 'all';
const HIDDEN = 'hidden';
/** Past this many views, Tabs gets crowded; a Select takes over. */
const MAX_TABS = 6;

interface ProductsViewProps {
  categories: AdminCategory[];
  products: AdminProduct[];
}

interface DialogState {
  key: number;
  open: boolean;
  product: AdminProduct | null;
}

/** The products page: views by category, the table, and the dialogs to add, edit and remove. */
export function ProductsView({ categories, products }: ProductsViewProps) {
  const [view, setView] = useState(ALL);
  const [sort, setSort] = useState<DataTableSort>({ key: 'name', direction: 'asc' });
  const [dialog, setDialog] = useState<DialogState>({ key: 0, open: false, product: null });
  const [removing, setRemoving] = useState<AdminProduct | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [removePending, startRemove] = useTransition();
  const [, startSwitch] = useTransition();
  const noticeId = useRef(0);
  const [shown, setShown] = useOptimistic(products, (rows: AdminProduct[], change: { id: string; visible: boolean }) =>
    rows.map((row) => (row.id === change.id ? { ...row, visible: change.visible } : row)),
  );

  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });

  // A view whose category was removed elsewhere falls back to all products.
  const current = view === ALL || view === HIDDEN || categories.some((category) => category.id === view) ? view : ALL;
  const views = [
    { id: ALL, label: 'All products', count: shown.length },
    ...categories.map((category) => ({ id: category.id, label: category.name, count: shown.filter((row) => row.categoryId === category.id).length })),
    { id: HIDDEN, label: 'Hidden', count: shown.filter((row) => !row.visible).length },
  ];
  const rows = sortRows(
    shown.filter((row) => (current === ALL ? true : current === HIDDEN ? !row.visible : row.categoryId === current)),
    sort,
  );

  function openDialog(product: AdminProduct | null) {
    setDialog((now) => ({ key: now.key + 1, open: true, product }));
  }

  function saved(result: ProductFormState) {
    setDialog((now) => ({ ...now, open: false }));
    const where = result.visible ? 'Clients can see it now.' : 'It stays off the storefront until you show it in the catalog.';
    say({ tone: 'success', title: result.isNew ? `Added ${result.name}` : `Saved ${result.name}`, body: where });
  }

  function toggle(product: AdminProduct, visible: boolean) {
    startSwitch(async () => {
      setShown({ id: product.id, visible });
      const result = await setProductVisible(product.id, visible);
      if (result.ok) {
        say({
          tone: 'success',
          title: visible ? `${product.name} is in the catalog` : `${product.name} is hidden`,
          body: visible ? 'Clients can see it and ask for a quote.' : 'Clients no longer see it. Everything about it is kept.',
        });
      } else {
        say(problemNotice(result.reason, 'product'));
      }
    });
  }

  function askRemove(product: AdminProduct) {
    setRemoving(product);
    setRemoveOpen(true);
  }

  function confirmRemove() {
    const product = removing;
    if (!product) return;
    startRemove(async () => {
      const result = await removeProduct(product.id);
      setRemoveOpen(false);
      if (result.ok) say({ tone: 'success', title: `Removed ${product.name}`, body: 'Inquiries that mention it keep its name and SKU.' });
      else say(problemNotice(result.reason, 'product'));
    });
  }

  const columns: Array<DataTableColumn<AdminProduct>> = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      minWidth: 240,
      render: (row) => (
        <span className="admin-cell-name">
          <strong>{row.name}</strong>
          {row.isSample ? <Badge tone="neutral">Sample</Badge> : null}
        </span>
      ),
    },
    { key: 'sku', header: 'SKU', mono: true, sortable: true, nowrap: true },
    { key: 'categoryName', header: 'Category', nowrap: true },
    {
      key: 'price',
      header: 'Price',
      mono: true,
      align: 'right',
      sortable: true,
      nowrap: true,
      render: (row) =>
        row.priceCents == null ? (
          <span className="admin-muted">
            <span aria-hidden="true">—</span>
            <span className="fhd-sr">No price</span>
          </span>
        ) : (
          MONEY.format(row.priceCents / 100)
        ),
    },
    {
      key: 'stock',
      header: 'Stock',
      nowrap: true,
      render: (row) => {
        const stock = STOCK_OPTIONS.find((option) => option.value === row.stock) ?? STOCK_OPTIONS[0];
        return (
          <Badge tone={stock.tone} dot>
            {stock.label}
          </Badge>
        );
      },
    },
    {
      key: 'visible',
      header: 'In catalog',
      render: (row) => (
        <Switch aria-label={`Show ${row.name} in catalog`} checked={row.visible} onChange={(event) => toggle(row, event.currentTarget.checked)} />
      ),
    },
    {
      key: 'actions',
      header: <span className="fhd-sr">Actions</span>,
      align: 'right',
      nowrap: true,
      render: (row) => (
        <span className="admin-row-tools">
          <Button size="sm" variant="ghost" icon="pencil-simple" aria-label={`Edit ${row.name}`} onClick={() => openDialog(row)} />
          <Button size="sm" variant="ghost" icon="trash" aria-label={`Remove ${row.name}`} onClick={() => askRemove(row)} />
        </span>
      ),
    },
  ];

  const viewName = views.find((item) => item.id === current)?.label ?? '';
  const startCategory = categories.some((category) => category.id === current) ? current : undefined;

  return (
    <>
      <AdminPageHead
        eyebrow="Catalog"
        title="Products"
        actions={
          <>
            <Button href="/" iconRight="arrow-up-right">
              View storefront
            </Button>
            <Button variant="primary" iconLeft="plus" onClick={() => openDialog(null)} disabled={!categories.length}>
              Add product
            </Button>
          </>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />

      <Panel flush title="Products" description="What clients can see and ask about." footer={`Showing ${rows.length} of ${shown.length}`}>
        {views.length > MAX_TABS ? (
          <div className="admin-view-select">
            <Select label="Show" options={views.map((item) => ({ value: item.id, label: `${item.label} (${item.count})` }))} value={current} onChange={(event) => setView(event.currentTarget.value)} />
          </div>
        ) : (
          <Tabs items={views} value={current} onChange={setView} ariaLabel="Product views" panelId={PANEL_ID} />
        )}
        <div id={PANEL_ID} role={views.length > MAX_TABS ? 'region' : 'tabpanel'} aria-labelledby={views.length > MAX_TABS ? undefined : `${PANEL_ID}-tab-${current}`} aria-label={views.length > MAX_TABS ? viewName : undefined}>
          <DataTable
            caption={`Products: ${viewName}`}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            sort={sort}
            onSort={setSort}
            empty={
              <EmptyState
                compact
                icon="package"
                title={current === HIDDEN ? 'Nothing is hidden' : 'No products here yet'}
                description={current === HIDDEN ? 'Every product is in the catalog.' : 'Add one, then show it in the catalog when it is ready.'}
                action={
                  current === HIDDEN || !categories.length ? undefined : (
                    <Button variant="primary" size="sm" iconLeft="plus" onClick={() => openDialog(null)}>
                      Add product
                    </Button>
                  )
                }
              />
            }
          />
        </div>
      </Panel>

      {dialog.key > 0 ? (
        <ProductDialog
          key={dialog.key}
          open={dialog.open}
          product={dialog.product}
          categories={categories}
          defaultCategoryId={startCategory}
          onClose={() => setDialog((now) => ({ ...now, open: false }))}
          onSaved={saved}
        />
      ) : null}

      <Dialog
        open={removeOpen}
        onClose={() => (removePending ? undefined : setRemoveOpen(false))}
        size="sm"
        title="Remove this product?"
        description={
          removing
            ? `${removing.name} leaves the catalog and the admin for good. Inquiries that mention it keep its name and SKU. To take it off the storefront for now, hide it instead.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removePending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmRemove} loading={removePending}>
              Remove product
            </Button>
          </>
        }
      />
    </>
  );
}

function sortRows(rows: AdminProduct[], sort: DataTableSort): AdminProduct[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const value = (row: AdminProduct) => (sort.key === 'price' ? row.priceCents : sort.key === 'sku' ? row.sku : row.name);
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    // Products with no price go last either way.
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en-US', { numeric: true, sensitivity: 'base' });
    return order * direction;
  });
}
