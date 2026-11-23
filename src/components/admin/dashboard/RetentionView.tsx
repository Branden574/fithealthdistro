'use client';

import { Badge, DataTable, Panel, StatCard, type DataTableColumn } from '@ds';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import type { RetentionMonth } from '@/lib/admin/dashboard';
import { pointsChange } from '@/lib/admin/dashboard-math';
import { RETENTION_DEFINITION, RetentionChart } from './RetentionChart';

const columns: Array<DataTableColumn<RetentionMonth>> = [
  {
    key: 'long',
    header: 'Month',
    nowrap: true,
    render: (row) => (
      <span className="admin-cell-name">
        <strong>{row.long}</strong>
        {row.current ? <Badge tone="neutral">So far</Badge> : null}
      </span>
    ),
  },
  {
    key: 'previous',
    header: 'Active before',
    align: 'right',
    mono: true,
    render: (row) => (
      <span className="admin-cell-stack">
        <span>{row.previous}</span>
        <span className="admin-muted">{row.before}</span>
      </span>
    ),
  },
  {
    key: 'returned',
    header: 'Active again',
    align: 'right',
    mono: true,
    render: (row) => (
      <span className="admin-cell-stack">
        <span>{row.returned}</span>
        <span className="admin-muted">{row.window}</span>
      </span>
    ),
  },
  {
    key: 'rate',
    header: 'Retention',
    align: 'right',
    render: (row) =>
      row.rate != null ? (
        <strong className="data">{`${row.rate}%`}</strong>
      ) : (
        <span className="admin-cell-stack">
          <span className="data">—</span>
          <span className="admin-muted">No clients to compare</span>
        </span>
      ),
  },
  { key: 'active', header: 'All active', align: 'right', mono: true },
];

/** Retention month by month: the chart, the counts behind each figure, and how it is worked out. */
export function RetentionView({ months }: { months: RetentionMonth[] }) {
  const now = months[months.length - 1];
  const before = months[months.length - 2];
  const change = now && before ? pointsChange(now.rate, before.rate) : undefined;
  return (
    <>
      <AdminPageHead eyebrow="Clients" title="Retention" />

      {now ? (
        <div className="dash-stats dash-stats--three">
          <StatCard
            label="Client retention"
            highlight
            value={now.rate != null ? now.rate : '—'}
            unit={now.rate != null ? '%' : undefined}
            delta={change}
            helper={now.rate == null ? 'Nothing to compare yet' : change ? 'vs. last month' : `${now.short} so far`}
          />
          <StatCard label="Came back" icon="arrows-clockwise" value={now.returned} helper={`of ${now.previous} active ${now.before}`} />
          <StatCard label="Active clients" icon="users-three" value={now.active} helper={`${now.window}, new clients included`} />
        </div>
      ) : null}

      <Panel title="Retention by month" description={RETENTION_DEFINITION}>
        <RetentionChart months={months} height={220} />
      </Panel>

      <Panel flush title="Month by month" description="Newest first. Each month compares its three months with the three before.">
        <DataTable caption="Client retention month by month" columns={columns} rows={[...months].reverse()} rowKey={(row) => row.month} />
      </Panel>

      <Panel title="How it is worked out">
        <ul className="dash-howto body-sm">
          <li>A client is active in a month when they send an inquiry, or you record activity or an order for them.</li>
          <li>Each month looks at three months: that month and the two before. It compares them with the three months before those.</li>
          <li>Retention is the share of clients active in the earlier three months who are active again in the later three. New clients count as active, not toward retention.</li>
          <li>When nobody was active in the earlier three months there is nothing to compare, so the month shows a dash instead of a figure.</li>
          <li>Months follow your time zone. This month&apos;s figure is so far and can rise until the month ends.</li>
        </ul>
      </Panel>
    </>
  );
}
