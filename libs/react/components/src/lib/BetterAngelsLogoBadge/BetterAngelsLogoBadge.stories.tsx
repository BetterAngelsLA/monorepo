import type { Meta, StoryObj } from '@storybook/react';
import { BetterAngelsLogoBadge } from './BetterAngelsLogoBadge';

const meta: Meta<typeof BetterAngelsLogoBadge> = {
  component: BetterAngelsLogoBadge,
  title: 'Components/BetterAngelsLogoBadge',
};
export default meta;

type Story = StoryObj<typeof BetterAngelsLogoBadge>;

export const BALogoBadge: Story = {
  render: (args) => <BetterAngelsLogoBadge {...args} />,
};
