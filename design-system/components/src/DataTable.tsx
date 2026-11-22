import * as React from 'react';
import { Checkbox } from './Checkbox';
import { Icon } from './Icon';
import { cx } from './util';

export interface DataTableColumn<Row = any> {
  /** Field name on the row; also the sort key. */
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** The narrowest the column may get before the table scrolls sideways. Give one to the name column. */
  minWidth?: number | string;
  /** Keeps the cell on one line. */
  nowrap?: boolean;
  /** Sets the cell in Chivo Mono: SKUs, prices, counts. */
  mono?: boolean;
  /** Makes the header a sort button. Sorting itself is yours: handle `onSort` and pass sorted `rows`. */
  sortable?: boolean;
  /** Custom cell. Defaults to `row[key]`. */
  render?: (row: Row, index: number) => React.ReactNode;
}

export interface DataTableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<Row = any> {
  columns: Array<DataTableColumn<Row>>;
  rows: Row[];
  /** A stable id for each row. */
  rowKey: (row: Row, index: number) => string;
  /** Names the table for screen readers: "Products". Not shown. */
  caption: string;
  sort?: DataTableSort;
  onSort?: (sort: DataTableSort) => void;
  /** Adds a checkbox column. */
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Tighter rows for long lists. */
  dense?: boolean;
  /** Shown in place of rows when there are none: an EmptyState. */
  empty?: React.ReactNode;
  className?: string;
}

/** The admin's list view: products, clients, inquiries. Scrolls sideways before it squeezes. */
export function DataTable<Row = any>(props: DataTableProps<Row>) {
  const { columns, rows, rowKey, caption, sort, onSort, selectable, selectedKeys = [], onSelectionChange, dense, empty, className } = props;
  const keys = rows.map(rowKey);
  const chosen = keys.filter((key) => selectedKeys.indexOf(key) !== -1);
  const all = rows.length > 0 && chosen.length === rows.length;
  const toggleAll = () => {
    if (onSelectionChange) onSelectionChange(all ? [] : keys);
  };
  const toggle = (key: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedKeys.indexOf(key) !== -1 ? selectedKeys.filter((k) => k !== key) : selectedKeys.concat(key));
  };
  const span = columns.length + (selectable ? 1 : 0);
  return (
    <div className={cx('fhd-table-wrap', className)}>
      <table className={cx('fhd-table', dense && 'fhd-table--dense')}>
        <caption className="fhd-sr">{caption}</caption>
        <thead>
          <tr>
            {selectable ? (
              <th scope="col" className="fhd-table__check">
                <Checkbox aria-label="Select all rows" checked={all} indeterminate={chosen.length > 0 && !all} onChange={toggleAll} />
              </th>
            ) : null}
            {columns.map((column) => {
              const active = sort && sort.key === column.key ? sort.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width, minWidth: column.minWidth, textAlign: column.align }}
                  aria-sort={active ? (active === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      className="fhd-table__sort"
                      onClick={() => onSort({ key: column.key, direction: active === 'asc' ? 'desc' : 'asc' })}
                    >
                      {column.header}
                      <Icon name={active === 'asc' ? 'caret-up' : active === 'desc' ? 'caret-down' : 'caret-up-down'} size={14} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={span} className="fhd-table__empty">
                {empty ?? 'Nothing here yet.'}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = keys[index];
              const selected = selectedKeys.indexOf(key) !== -1;
              return (
                <tr key={key} aria-selected={selectable ? selected : undefined}>
                  {selectable ? (
                    <td className="fhd-table__check">
                      <Checkbox aria-label="Select row" checked={selected} onChange={() => toggle(key)} />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className={cx(column.mono && 'fhd-table__mono', column.nowrap && 'fhd-table__nowrap')} style={{ textAlign: column.align }}>
                      {column.render ? column.render(row, index) : ((row as Record<string, React.ReactNode>)[column.key] ?? null)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
