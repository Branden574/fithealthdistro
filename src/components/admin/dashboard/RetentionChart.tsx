import { BarChart, EmptyState } from '@ds';
import type { RetentionMonth } from '@/lib/admin/dashboard';

/** What every retention figure on the admin means. Shown beside the numbers. */
export const RETENTION_DEFINITION =
  'Of the clients active in the three months before, the share active again in the latest three. Active means an inquiry, recorded activity or an order.';

interface RetentionChartProps {
  months: RetentionMonth[];
  /** Prints each figure above its bar. For eight months or fewer. */
  showValues?: boolean;
  height?: number;
}

/** Retention by month, oldest first. A month with nobody to compare shows a dash, never a zero. */
export function RetentionChart({ months, showValues = false, height = 200 }: RetentionChartProps) {
  if (!months.some((month) => month.rate != null)) {
    return (
      <EmptyState
        compact
        icon="chart-bar"
        title="Nothing to measure yet"
        description="Retention compares each three months with the three before. It shows once clients have been active across that time."
      />
    );
  }
  const first = months[0];
  const last = months[months.length - 1];
  const current = months.find((month) => month.current);
  const gaps = months.some((month) => month.rate == null);
  return (
    <div className="dash-chart">
      <BarChart
        data={months.map((month) => ({ label: month.short, value: month.rate }))}
        unit="%"
        showValues={showValues}
        height={height}
        emptyLabel="no clients to compare"
        ariaLabel={`Client retention by month, ${first.long} to ${last.long}.`}
      />
      {current || gaps ? (
        <p className="admin-muted body-sm dash-chart__note">
          {[current ? `${current.short} is so far: the month is not over.` : '', gaps ? 'A dash means nobody was active in the three months before.' : '']
            .filter(Boolean)
            .join(' ')}
        </p>
      ) : null}
    </div>
  );
}
