import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Text } from '../base-ui/text/text';

const ICON_SIZE = 22;
const iconClass = 'shrink-0 text-[#747A82]';

/** A single stat box: icon + label + value. Placeholder value for now. */
function StatCardPlaceholder({
  icon,
  label,
  value,
  testId,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: string;
  testId?: string;
}) {
  return (
    <div
      className="flex min-h-[109px] flex-1 flex-col gap-3 rounded-[20px] bg-white p-3"
      data-testid={testId}
    >
      <div className="flex items-start gap-2.5">
        {icon}
        <Text variant="body" textColor="text-[#747A82]">
          {label}
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

/**
 * "Reservation Status Changes" section — heading plus the reservation stat
 * boxes. Per the design, four transition stats sit grouped in one rounded grey
 * container (the first two paired behind a divider) and "Average days to
 * occupancy" is a separated container. Values are placeholders until wired up.
 */
export function ReservationStatusChanges() {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="subheading" textColor="text-[#111827]">
        Reservation Status Changes
      </Text>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex flex-[4] flex-wrap items-stretch gap-3 rounded-[28px] bg-[#F3F3F3] p-3">
          <div className="flex min-w-[300px] flex-[1.6] items-stretch rounded-[20px] bg-white">
            <StatCardPlaceholder
              icon={<CalendarCheck2 size={ICON_SIZE} className={iconClass} />}
              label="Newly Checked In"
              value="8"
              testId="stat-newly-checked-in-placeholder"
            />
            <CardDivider />
            <StatCardPlaceholder
              icon={<CalendarClock size={ICON_SIZE} className={iconClass} />}
              label={
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  Overdue
                  <ArrowRight size={16} className={iconClass} />
                  Checked In
                </span>
              }
              value="3"
              testId="stat-overdue-to-checked-in-placeholder"
            />
          </div>
          <StatCardPlaceholder
            icon={<CalendarX2 size={ICON_SIZE} className={iconClass} />}
            label="Newly Canceled"
            value="7"
            testId="stat-newly-canceled-placeholder"
          />
          <StatCardPlaceholder
            icon={<CalendarClock size={ICON_SIZE} className={iconClass} />}
            label="Newly Overdue"
            value="12"
            testId="stat-newly-overdue-placeholder"
          />
        </div>

        <div className="flex rounded-[28px] bg-[#F3F3F3] p-3 lg:flex-1">
          <StatCardPlaceholder
            icon={<Clock size={ICON_SIZE} className={iconClass} />}
            label="Average days to occupancy"
            value="10"
            testId="stat-average-days-to-occupancy-placeholder"
          />
        </div>
      </div>
    </div>
  );
}
