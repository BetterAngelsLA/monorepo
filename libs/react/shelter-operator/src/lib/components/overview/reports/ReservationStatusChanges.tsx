import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Text } from '../../base-ui/text/text';

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
    <div className="min-w-[10rem] flex-1 px-4 py-3" data-testid={testId}>
      <div className="flex items-center gap-2 text-[#6B7280]">
        {icon}
        <Text variant="caption" textColor="text-[#6B7280]">
          {label}
        </Text>
      </div>
      <Text
        variant="header-md"
        textColor="text-[#111827]"
        className="mt-2 block"
      >
        {value}
      </Text>
    </div>
  );
}

const iconClass = 'text-[#6B7280]';

/**
 * "Reservation Status Changes" section — heading plus the row of reservation
 * stat boxes. Per the design, the first four boxes sit in one grouped container
 * (the first two form a divider-split pair) and "Average days to occupancy" is
 * a separated box. Values are placeholders until the real metrics are wired up.
 */
export function ReservationStatusChanges() {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="subheading" textColor="text-[#111827]">
        Reservation Status Changes
      </Text>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-wrap divide-x divide-[#E5E7EB] rounded-xl border border-[#E5E7EB] bg-white">
          <div className="flex flex-[2] divide-x divide-[#E5E7EB]">
            <StatCardPlaceholder
              icon={<CalendarCheck2 size={18} className={iconClass} />}
              label="Newly Checked In"
              value="8"
              testId="stat-newly-checked-in-placeholder"
            />
            <StatCardPlaceholder
              icon={<CalendarClock size={18} className={iconClass} />}
              label={
                <span className="inline-flex items-center gap-1">
                  Overdue
                  <ArrowRight size={14} className={iconClass} />
                  Checked In
                </span>
              }
              value="3"
              testId="stat-overdue-to-checked-in-placeholder"
            />
          </div>
          <StatCardPlaceholder
            icon={<CalendarX2 size={18} className={iconClass} />}
            label="Newly Canceled"
            value="7"
            testId="stat-newly-canceled-placeholder"
          />
          <StatCardPlaceholder
            icon={<CalendarClock size={18} className={iconClass} />}
            label="Newly Overdue"
            value="12"
            testId="stat-newly-overdue-placeholder"
          />
        </div>

        <div className="flex rounded-xl border border-[#E5E7EB] bg-white">
          <StatCardPlaceholder
            icon={<Clock size={18} className={iconClass} />}
            label="Average days to occupancy"
            value="10"
            testId="stat-average-days-to-occupancy-placeholder"
          />
        </div>
      </div>
    </div>
  );
}
