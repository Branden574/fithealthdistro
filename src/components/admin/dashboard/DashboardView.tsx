'use client';

import { Badge, BarChart, Button, CountUp, EmptyState, InquiryCard, Panel, StatCard, Tabs } from '@ds';
import { useRef, useState } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { NoticeBar, type Notice } from '@/components/admin/Notice';
import { useInquiryStatus } from '@/components/admin/inquiries/useInquiryStatus';
import type { DashboardStats, SalesPeriod } from '@/lib/admin/dashboard';
import { countChange, percentChange, pointsChange, rate } from '@/lib/admin/dashboard-math';
import type { AdminInquiry } from '@/lib/admin/inquiries';
import { formatDollars, formatWholeDollars } from '@/lib/admin/money';
import { CLIENTS_PATH, INQUIRIES_PATH, inquiryPath, RETENTION_PATH } from '@/lib/admin/paths';
import { RETENTION_DEFINITION, RetentionChart } from './RetentionChart';

interface DashboardViewProps {
  stats: DashboardStats;
  latest: (AdminInquiry & { replyHref: string }) | null;
}

const BOARD_ID = 'sales-board';
const percent = (value: number) => `${Math.round(value)}`;

/** The admin's home. The figures show as they are; switching the sales period moves them to the new values. */
export function DashboardView({ stats, latest }: DashboardViewProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeId = useRef(0);
  const say = (next: Omit<Notice, 'id'>) => setNotice({ ...next, id: ++noticeId.current });
  const { shown, busy, move, replying } = useInquiryStatus(latest ? [latest] : [], say);
  const inquiry = shown[0] ?? null;

  const now = stats.months[stats.months.length - 1];
  const before = stats.months[stats.months.length - 2];
  const retentionChange = now && before ? pointsChange(now.rate, before.rate) : undefined;

  return (
    <>
      <AdminPageHead
        eyebrow="Admin"
        title="Dashboard"
        actions={
          <Button href="/" newTab newTabLabel="(opens in a new tab)" iconRight="arrow-up-right">
            View site
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />

      <div className="dash-stats">
        <StatCard
          label="Active clients"
          icon="users-three"
          value={now ? now.active.toLocaleString('en-US') : '0'}
          delta={now ? countChange(now.active, now.previous) : undefined}
          helper="Last 3 months, vs. the 3 before"
        />
        <StatCard
          label="Client retention"
          highlight
          value={now?.rate != null ? now.rate : '—'}
          unit={now?.rate != null ? '%' : undefined}
          delta={retentionChange}
          helper={now?.rate == null ? 'Nothing to compare yet' : retentionChange ? 'vs. last month' : 'This month so far'}
        />
        <StatCard
          label="New inquiries"
          icon="tray"
          value={stats.inquiries.recent.toLocaleString('en-US')}
          delta={countChange(stats.inquiries.recent, stats.inquiries.previous)}
          helper="Last 7 days, vs. the 7 before"
        />
        <StatCard
          label="Products live"
          icon="package"
          value={stats.products.live.toLocaleString('en-US')}
          helper={stats.products.hidden ? `${stats.products.hidden} hidden` : 'None hidden'}
        />
      </div>

      <div className="dash-cols">
        <Panel
          title="Client retention"
          description={RETENTION_DEFINITION}
          actions={
            <Button size="sm" variant="ghost" iconRight="arrow-right" href={RETENTION_PATH}>
              Every month
            </Button>
          }
        >
          <RetentionChart months={stats.months.slice(-6)} showValues height={232} />
        </Panel>

        <section className="dash-latest" aria-labelledby="latest-title">
          <div className="dash-latest__head">
            <h2 className="display-sm" id="latest-title">
              Latest inquiry
            </h2>
            {stats.inquiries.unread ? <Badge tone="accent">{`${stats.inquiries.unread} new`}</Badge> : null}
          </div>
          {inquiry ? (
            <>
              <InquiryCard
                name={inquiry.name}
                company={inquiry.company}
                email={inquiry.email}
                phone={inquiry.phone}
                receivedAt={inquiry.receivedAt}
                message={inquiry.message}
                interestedIn={inquiry.askedAbout}
                status={inquiry.status}
                href={inquiryPath(inquiry.id)}
                replyHref={inquiry.replyHref}
                onReply={() => replying(inquiry)}
                onMarkRead={() => move(inquiry, 'read', inquiry.status)}
                onMarkReplied={() => move(inquiry, 'replied', inquiry.status)}
                busy={busy.includes(inquiry.id)}
              />
              <Button size="sm" variant="ghost" iconRight="arrow-right" href={INQUIRIES_PATH}>
                All inquiries
              </Button>
            </>
          ) : (
            <Panel>
              <EmptyState compact icon="tray" title="No inquiries yet" description="They show here as soon as someone sends the contact form." />
            </Panel>
          )}
        </section>
      </div>

      <SalesBoard periods={stats.periods} ordersRecorded={stats.ordersRecorded} />
    </>
  );
}

/** Sales and conversion over the last 30, 60 or 90 days. Switching the period moves every figure to its new value. */
function SalesBoard({ periods, ordersRecorded }: { periods: SalesPeriod[]; ordersRecorded: number }) {
  const [days, setDays] = useState(periods[0]?.days ?? 30);
  const period = periods.find((item) => item.days === days) ?? periods[0];

  if (!ordersRecorded || !period) {
    return (
      <Panel title="Sales and conversion" description="From the orders you record on client pages.">
        <EmptyState
          icon="receipt"
          title="No orders recorded yet"
          description="Record an order on a client's page. Its total shows here, with how many inquiries turn into orders."
          action={
            <Button href={CLIENTS_PATH} iconRight="arrow-right">
              Go to clients
            </Button>
          }
        />
      </Panel>
    );
  }

  const conversion = rate(period.converted, period.inquiries);
  const previousConversion = rate(period.previousConverted, period.previousInquiries);
  const average = period.orders ? period.sales / period.orders : null;
  const previousAverage = period.previousOrders ? period.previousSales / period.previousOrders : null;
  const versus = `vs. the ${days} days before`;
  const lastSlice = period.slices[period.slices.length - 1];

  return (
    <Panel
      title="Sales and conversion"
      description="From the orders you record on client pages. An inquiry converts once its client has an order on or after the day it came in."
    >
      <div className="dash-board">
        <Tabs
          items={periods.map((item) => ({ id: String(item.days), label: `${item.days} days` }))}
          value={String(days)}
          onChange={(id) => setDays(Number(id))}
          ariaLabel="Sales period"
          panelId={BOARD_ID}
        />
        <div id={BOARD_ID} role="tabpanel" aria-labelledby={`${BOARD_ID}-tab-${days}`} className="dash-board__panel">
          <div className="dash-stats">
            <StatCard
              label="Sales"
              highlight
              value={<CountUp value={period.sales} format={formatWholeDollars} />}
              delta={percentChange(period.sales, period.previousSales)}
              helper={period.previousSales ? versus : `None in the ${days} days before`}
            />
            <StatCard
              label="Orders"
              icon="receipt"
              value={<CountUp value={period.orders} />}
              delta={countChange(period.orders, period.previousOrders)}
              helper={versus}
            />
            <StatCard
              label="Average order"
              icon="currency-dollar"
              value={average != null ? <CountUp value={average} format={formatWholeDollars} /> : '—'}
              delta={average != null && previousAverage != null ? percentChange(average, previousAverage) : undefined}
              helper={average == null ? `No orders in ${days} days` : previousAverage == null ? `None in the ${days} days before` : versus}
            />
            <StatCard
              label="Conversion"
              icon="chart-line-up"
              value={conversion != null ? <CountUp value={conversion} format={percent} /> : '—'}
              unit={conversion != null ? '%' : undefined}
              delta={pointsChange(conversion, previousConversion)}
              helper={conversion == null ? `No inquiries in ${days} days` : previousConversion == null ? `No inquiries the ${days} days before` : versus}
            />
          </div>
          <p className="admin-muted body-sm" aria-live="polite">
            {period.inquiries
              ? `${period.converted} of the ${period.inquiries} ${period.inquiries === 1 ? 'inquiry' : 'inquiries'} from the last ${days} days ${period.converted === 1 ? 'has' : 'have'} an order so far.`
              : `No inquiries came in during the last ${days} days.`}
          </p>
          <div className="dash-chart">
            <h3 className="label dash-chart__title">Sales by {period.sliceDays} days</h3>
            <BarChart
              data={period.slices.map((slice) => ({ label: slice.label, value: slice.sales }))}
              format={formatDollars}
              height={200}
              ariaLabel={`Sales over the last ${days} days in ${period.sliceDays}-day steps, each ending on the day shown, the last on ${lastSlice?.long ?? 'today'}.`}
            />
            <p className="admin-muted body-sm dash-chart__note">Each bar is {period.sliceDays} days, ending on the day under it.</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
