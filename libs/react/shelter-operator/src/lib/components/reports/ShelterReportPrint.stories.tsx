import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { ShelterReportPrint } from '../../pages/report/ShelterReportPrint';

const meta: Meta<typeof ShelterReportPrint> = {
  component: ShelterReportPrint,
  title: 'Reports/ShelterReportPrint',
};
export default meta;

type Story = StoryObj<typeof ShelterReportPrint>;

const DAYS = Array.from({ length: 21 }, (_, i) => {
  const date = new Date(2026, 6, i + 2);
  return date.toISOString().slice(0, 10);
});

/** The generated types brand dates as `DateString` and require `__typename`. */
type ReportProps = ComponentProps<typeof ShelterReportPrint>;

const dailyBedStatus: ReportProps['dailyBedStatus'] = DAYS.map((date, i) => ({
  __typename: 'DailyBedStatusMetricsType',
  date: date as NonNullable<ReportProps['dailyBedStatus']>[number]['date'],
  occupied: 10 + (i % 8),
  available: 8 + (i % 6),
  reserved: 10 + (i % 5),
  outOfService: 4 + (i % 4),
  inTurnaround: 2 + (i % 3),
}));

const dailyOccupancy: ReportProps['dailyOccupancy'] = DAYS.map((date, i) => ({
  __typename: 'DailyOccupancyMetricsType',
  date: date as NonNullable<ReportProps['dailyOccupancy']>[number]['date'],
  occupiedCount: 20 + (i % 12),
  totalBeds: 50,
  occupancyPct: 30 + ((i * 7) % 40),
}));

const baseArgs: Partial<ReportProps> = {
  shelterName: 'The Woodlands',
  shelterAddress: '20157 Ventura Bvld, Woodland Hills, CA, 91364',
  range: { from: new Date(2026, 6, 2), to: new Date(2026, 6, 8) },
  generatedAt: new Date(2026, 6, 9, 16, 57),
  metrics: {
    __typename: 'ReservationMetricsType',
    checkedIn: 8,
    checkInOverdueToCheckedIn: 1,
    cancelled: 7,
    checkInOverdue: 12,
  } as const,
  avgDaysToOccupancy: 10,
  dailyBedStatus,
  dailyOccupancy,
};

export const AllMetrics: Story = {
  args: {
    ...baseArgs,
    includedMetrics: [
      'avg_days_to_occupancy',
      'reservation_metrics',
      'daily_bed_status_metrics',
      'daily_occupancy_metrics',
    ],
  },
};

export const WithoutAvgDaysToOccupancy: Story = {
  args: {
    ...baseArgs,
    includedMetrics: [
      'reservation_metrics',
      'daily_bed_status_metrics',
      'daily_occupancy_metrics',
    ],
  },
};

export const OnlyAvgDaysToOccupancy: Story = {
  args: {
    ...baseArgs,
    // The stat row collapses to a single flat item, but bed-status/daily-
    // occupancy are independent checkboxes — the charts still show.
    includedMetrics: [
      'avg_days_to_occupancy',
      'daily_bed_status_metrics',
      'daily_occupancy_metrics',
    ],
  },
};
