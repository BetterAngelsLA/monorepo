import type { Meta, StoryObj } from '@storybook/react';
import { ReservationStatusChanges } from './ReservationStatusChanges';

const meta: Meta<typeof ReservationStatusChanges> = {
  component: ReservationStatusChanges,
  title: 'Reports/ReservationStatusChanges',
};
export default meta;

type Story = StoryObj<typeof ReservationStatusChanges>;

const pageDecorator: Story['decorators'] = [
  (Story) => (
    <div style={{ background: '#F9FAFB', padding: 24 }}>
      <Story />
    </div>
  ),
];

export const Default: Story = {
  decorators: pageDecorator,
  args: {
    metrics: {
      checkedIn: 8,
      checkInOverdueToCheckedIn: 1,
      cancelled: 7,
      checkInOverdue: 12,
    },
    avgDaysToOccupancy: 10,
  },
};
