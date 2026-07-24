import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock,
} from 'lucide-react';
import { mergeCss } from '@monorepo/react/shared';
import type { ReactNode } from 'react';
import { Text } from '../base-ui/text/text';
import { ReservationMetricsType } from './types';

const ICON_SIZE = 18;
const iconClass = 'shrink-0 text-[#747A82]';

export interface IStatCardProps {
  icon: ReactNode;
  title: ReactNode;
  value: string;
  testId?: string;
  className?: string;
}

/** A single stat box: icon, title, and value. */
export function StatCard({ icon, title, value, testId, className }: IStatCardProps) {
  return (
    <div
      className={mergeCss([
        'flex h-[109px] flex-col gap-4 rounded-[20px] bg-white p-2.5',
        className ?? 'flex-1',
      ])}
      data-testid={testId}
    >
      <div className="flex items-start gap-2">
        {icon}
        <Text variant="body" textColor="text-[#747A82]">
          {title}
        </Text>
      </div>
      <Text variant="header-lg" textColor="text-black" className="leading-none">
        {value}
      </Text>
    </div>
  );
}

/** Thin divider used between the paired stat cards. */
function CardDivider() {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="my-3 w-[3px] shrink-0 rounded-full bg-[#F3F3F3]"
    />
  );
}

export interface IConjoinedStatCardProps {
  left: IStatCardProps;
  right: IStatCardProps;
}

/** Two StatCards joined by a divider inside a shared rounded container. */
export function ConjoinedStatCard({ left, right }: IConjoinedStatCardProps) {
  return (
    <div className="flex min-w-[300px] grow-[507] basis-0 items-stretch rounded-[20px] bg-white">
      <StatCard {...left} className="min-w-[130px] grow-[195] basis-0" />
      <CardDivider />
      <StatCard {...right} className="min-w-[160px] grow-[240] basis-0" />
    </div>
  );
}

export interface IReservationStatusChangesProps {
  metrics: ReservationMetricsType;
  avgDaysToOccupancy: number | null;
}

/**
 * "Reservation Status Changes" section — heading plus the reservation stat
 * boxes. Per the design, four transition stats sit grouped in one rounded grey
 * container (the first two paired behind a divider) and "Average days to
 * occupancy" is a separated container.
 */
export function ReservationStatusChanges({
  metrics,
  avgDaysToOccupancy,
}: IReservationStatusChangesProps) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="subheading" textColor="text-[#111827]">
        Reservation Status Changes
      </Text>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex grow-[1091] basis-0 flex-wrap items-stretch gap-5 rounded-[28px] bg-[#F3F3F3] p-3">
          <ConjoinedStatCard
            left={{
              icon: <CalendarCheck2 size={ICON_SIZE} className={iconClass} />,
              title: 'Newly Checked In',
              value: String(metrics.checkedIn),
              testId: 'stat-newly-checked-in',
            }}
            right={{
              icon: <CalendarClock size={ICON_SIZE} className={iconClass} />,
              title: (
                <>
                  Overdue{' '}
                  <ArrowRight
                    size={13}
                    className={`${iconClass} inline-block align-middle`}
                  />{' '}
                  Checked In
                </>
              ),
              value: String(metrics.checkInOverdueToCheckedIn),
              testId: 'stat-overdue-to-checked-in',
            }}
          />
          <StatCard
            icon={<CalendarX2 size={ICON_SIZE} className={iconClass} />}
            title="Newly Canceled"
            value={String(metrics.cancelled)}
            testId="stat-newly-canceled"
            className="min-w-[140px] grow-[268] basis-0"
          />
          <StatCard
            icon={<CalendarClock size={ICON_SIZE} className={iconClass} />}
            title="Newly Overdue"
            value={String(metrics.checkInOverdue)}
            testId="stat-newly-overdue"
            className="min-w-[140px] grow-[268] basis-0"
          />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          className="hidden h-[83px] w-[3px] shrink-0 self-center rounded-full bg-[#E3E3E3] lg:block"
        />

        <div className="flex p-3 lg:grow-[298] lg:basis-0">
          <StatCard
            icon={<Clock size={ICON_SIZE} className={iconClass} />}
            title="Average days to occupancy"
            value={avgDaysToOccupancy != null ? String(avgDaysToOccupancy) : '—'}
            testId="stat-average-days-to-occupancy"
            className="min-w-[220px] flex-1"
          />
        </div>
      </div>
    </div>
  );
}
