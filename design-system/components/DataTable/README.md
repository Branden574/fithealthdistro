# DataTable

The admin's list view: products, clients, inquiries.

The header is uppercase Big Shoulders on `bg-subtle` over a `border-thick` `ink` rule. Rows are divided by `line` hairlines. A selected row fills with `accent-soft` and takes a `border-heavy` `accent-ink` marker on its left edge.

## You provide

- `columns`: each has a `key`, a `header` and optionally `render` for a custom cell.
- `rows` and `rowKey`, a stable id per row.
- `caption`: names the table for screen readers.

## Columns

- Set `mono` on SKUs, prices and counts, and `align: 'right'` on anything numeric.
- Give the name column a `minWidth` (240px works) so the table scrolls sideways before the name is squeezed.
- Status is a Badge. "In catalog" is a Switch with an `aria-label` that names the row.
- Row actions sit in the last column as `ghost` `sm` icon Buttons with `aria-label`s: edit, then remove.

## Sorting and selection

Both are controlled. Mark columns `sortable`, handle `onSort` and pass the rows back already sorted. With `selectable`, keep `selectedKeys` and handle `onSelectionChange`.

## Empty and dense

Pass an EmptyState to `empty`. Use `dense` for lists longer than about 20 rows.

## Don't

- Don't remove a product straight from the row. The trash button opens a Dialog.
- Don't hide columns on small screens. Let the table scroll.
