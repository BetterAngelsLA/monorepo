import { mergeCss } from '@monorepo/react/shared';
import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ReservationMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { Text } from '../base-ui/text/text';

const ICON_SIZE = 18;
const iconClass = 'shrink-0 text-[#747A82]';

export interface IStatCardProps {
  icon?: ReactNode;
  title: ReactNode;
  value: string;
  testId?: string;
  className?: string;
  subRow?: ReactNode;
}

/** A single stat card: optional icon, title, value, and an optional secondary row. */
export function StatCard({ icon, title, value, testId, className, subRow }: IStatCardProps) {
  return (
    <div
      className={mergeCss([
        'flex h-[120px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0_0_4px_rgba(154,154,154,0.13)]',
        className ?? 'flex-1',
      ])}
      data-testid={testId}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          {icon}
          <Text variant="body" textColor="text-[#747A82]" className="text-[15px]">
            {title}
          </Text>
        </div>
        <Text variant="header-lg" textColor="text-black" className="text-[25px] leading-none">
          {value}
        </Text>
      </div>
      {subRow}
    </div>
  );
}

export interface IPreviouslyOverdueRowProps {
  overdueCount?: number | null;
  totalCount?: number | null;
}

/** "Previously Overdue x / y" pill shown under the Newly Checked In stat. */
function PreviouslyOverdueRow({ overdueCount, totalCount }: IPreviouslyOverdueRowProps) {
  return (
    <div className="flex items-center justify-between" data-testid="stat-previously-overdue">
      <Text variant="body" textColor="text-[#747A82]" className="text-[13px] leading-[150%]">
        Previously Overdue
      </Text>
      <span className="rounded-full bg-[#F3F3F9] px-6 py-0.5 text-[13px] leading-[150%] text-[#383B40]">
        {overdueCount ?? '—'} / {totalCount ?? '—'}
      </span>
    </div>
  );
}

export interface IReservationStatusChangesProps {
  metrics?: ReservationMetrics | null;
  avgDaysToOccupancy?: number | null;
}

/**
 * "Reservation Status Changes" section — heading plus four equal-width stat
 * cards. The first card shows a "Previously Overdue" ratio pill beneath its
 * value, and a vertical divider separates "Average days to occupancy" from
 * the rest.
 */
export function ReservationStatusChanges({
  metrics,
  avgDaysToOccupancy,
}: IReservationStatusChangesProps) {
  return (
    <div className="flex flex-col gap-4">
      <Text variant="subheading" textColor="text-[#111827]" className="pl-2">
        Reservation Status Changes
      </Text>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <StatCard
          title="Newly Checked In"
          value={metrics?.checkedIn != null ? String(metrics.checkedIn) : '—'}
          subRow={
            <PreviouslyOverdueRow
              overdueCount={metrics?.checkInOverdueToCheckedIn}
              totalCount={metrics?.checkedIn}
            />
          }
          testId="stat-newly-checked-in"
          className="basis-0 lg:flex-1"
        />
        <StatCard
          title="Newly Canceled"
          value={metrics?.cancelled != null ? String(metrics.cancelled) : '—'}
          testId="stat-newly-canceled"
          className="basis-0 lg:flex-1"
        />
        <StatCard
          title="Newly Overdue"
          value={metrics?.checkInOverdue != null ? String(metrics.checkInOverdue) : '—'}
          testId="stat-newly-overdue"
          className="basis-0 lg:flex-1"
        />

        <div
          role="separator"
          aria-orientation="vertical"
          className="hidden h-[93px] w-[3px] shrink-0 self-center rounded-full bg-[#D0CFCF] lg:block"
        />

        <StatCard
          icon={<Clock size={ICON_SIZE} className={iconClass} />}
          title="Average days to occupancy"
          value={avgDaysToOccupancy != null ? String(avgDaysToOccupancy) : '—'}
          testId="stat-average-days-to-occupancy"
          className="basis-0 lg:flex-1"
        />
      </div>
    </div>
  );
}
