import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './BarChart';

const meta: Meta<typeof BarChart> = {
  component: BarChart,
  title: 'Charts/BarChart',
};
export default meta;

type Story = StoryObj<typeof BarChart>;

// Daily dates (Jun 1 – Jun 28)
const DAYS = Array.from({ length: 28 }, (_, i) => `Jun ${i + 1}`);

// 90-day range to exercise maxBars bucketing
const DAYS_90 = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 0, 1);
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

const STATUSES = ['Occupied', 'Available', 'Reserved', 'Out of Service'];
const STATUS_COLORS = ['#008CEE', '#05B428', '#FF7B00', '#F64949'];

// Sample count data
const bedStatusData = DAYS.flatMap((date) => [
  { date, status: 'Occupied', count: Math.floor(Math.random() * 12) + 10 },
  { date, status: 'Available', count: Math.floor(Math.random() * 10) + 5 },
  { date, status: 'Reserved', count: Math.floor(Math.random() * 12) + 8 },
  { date, status: 'Out of Service', count: Math.floor(Math.random() * 10) + 5 },
]);

const bedStatusPercentageData = DAYS.flatMap((date, i) => [
  { date, status: 'Occupied', count: 28 + (i % 5) },
  { date, status: 'Available', count: 18 + (i % 4) },
  { date, status: 'Reserved', count: 20 - (i % 3) },
  { date, status: 'Out of Service', count: 12 - (i % 4) },
]);

const dailyTotalData = DAYS.map((date, i) => ({
  date,
  count:
    40 + Math.floor(Math.sin(i * 0.4) * 15) + Math.floor(Math.random() * 10),
}));

const dailyTotalPercentageData = DAYS.map((date, i) => ({
  date,
  count: Math.min(
    100,
    Math.max(
      0,
      55 +
        Math.floor(Math.sin(i * 0.7) * 20) +
        Math.floor(Math.cos(i * 0.3) * 10),
    ),
  ),
}));

// Large dataset (90 days) for the maxBars story
const bedStatus90Data = DAYS_90.flatMap((date, i) => [
  { date, status: 'Occupied', count: 25 + Math.floor(Math.sin(i * 0.15) * 8) },
  {
    date,
    status: 'Available',
    count: 12 + Math.floor(Math.cos(i * 0.2) * 5),
  },
  { date, status: 'Reserved', count: 8 + (i % 4) },
  { date, status: 'Out of Service', count: 3 + (i % 3) },
]);

const dailyTotal90Data = DAYS_90.map((date, i) => ({
  date,
  count: 48 + Math.floor(Math.sin(i * 0.1) * 20),
}));

const cardDecorator: Story['decorators'] = [
  (Story) => (
    <div
      style={{
        width: 801,
        height: 596,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <Story />
    </div>
  ),
];

export const VerticalBarChart: Story = {
  parameters: {
    customLayout: { variant: 'basic' },
  },
  decorators: cardDecorator,
  args: {
    chartTitle: 'Daily Occupancy',
    showViewToggle: true,
    onViewChange: (mode) =>
      mode === 'percentage'
        ? {
            data: dailyTotalPercentageData,
            axis: { y: { title: 'Occupancy by %', tickCount: 6 } },
            scale: { y: { nice: false, domain: [0, 100] } },
          }
        : {},
    data: dailyTotalData,
    xField: 'date',
    yField: 'count',
    axis: {
      x: { title: 'Date' },
      y: { title: 'Number of Beds Occupied', tickCount: 6 },
    },
    scale: {
      x: { padding: 0.4 },
      y: { nice: true },
    },
    style: {
      fill: '#008CEE',
    },
    tooltip: { title: 'date' },
    className: 'h-full',
  },
};

export const StackedBarChart: Story = {
  parameters: {
    customLayout: { variant: 'basic' },
  },
  decorators: cardDecorator,
  args: {
    chartTitle: 'Bed Status',
    showViewToggle: true,
    onViewChange: (mode) =>
      mode === 'percentage'
        ? {
            data: bedStatusPercentageData,
            axis: { y: { title: 'Status by %', tickCount: 6 } },
            scale: { y: { nice: false, domain: [0, 100] } },
          }
        : {},
    data: bedStatusData,
    xField: 'date',
    yField: 'count',
    colorField: 'status',
    stack: true,
    axis: {
      x: { title: 'Date' },
      y: { title: 'Status by Count', tickCount: 6 },
    },
    scale: {
      color: { domain: STATUSES, range: STATUS_COLORS },
      x: { padding: 0.4 },
      y: { nice: true },
    },
    style: {
      stroke: '#ffffff',
      lineWidth: 1,
      inset: 0.1,
    },
    tooltip: { title: 'date' },
    className: 'h-full',
  },
};

/** 90 days of data bucketed into ≤40 bars (averaged). Each bar label shows the
 *  date range it represents. */
export const BucketedStackedBarChart: Story = {
  parameters: {
    customLayout: { variant: 'basic' },
  },
  decorators: cardDecorator,
  args: {
    chartTitle: 'Bed Status (90 days → ≤40 bars)',
    showViewToggle: false,
    maxBars: 40,
    data: bedStatus90Data,
    xField: 'date',
    yField: 'count',
    colorField: 'status',
    stack: true,
    axis: {
      x: { title: 'Date Range' },
      y: { title: 'Avg Status Count', tickCount: 6 },
    },
    scale: {
      color: { domain: STATUSES, range: STATUS_COLORS },
      x: { padding: 0.4 },
      y: { nice: true },
    },
    style: {
      stroke: '#ffffff',
      lineWidth: 1,
      inset: 0.1,
    },
    tooltip: { title: 'date' },
    className: 'h-full',
  },
};

/** 90 days of single-series data bucketed into ≤40 bars. */
export const BucketedVerticalBarChart: Story = {
  parameters: {
    customLayout: { variant: 'basic' },
  },
  decorators: cardDecorator,
  args: {
    chartTitle: 'Daily Occupancy (90 days → ≤40 bars)',
    showViewToggle: false,
    maxBars: 40,
    data: dailyTotal90Data,
    xField: 'date',
    yField: 'count',
    axis: {
      x: { title: 'Date Range' },
      y: { title: 'Avg Occupied', tickCount: 6 },
    },
    scale: {
      x: { padding: 0.4 },
      y: { nice: true },
    },
    style: { fill: '#008CEE' },
    tooltip: { title: 'date' },
    className: 'h-full',
  },
};
