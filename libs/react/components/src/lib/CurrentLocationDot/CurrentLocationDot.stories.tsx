import type { Meta, StoryObj } from '@storybook/react';
import { CurrentLocationDot } from './CurrentLocationDot';

const meta: Meta<typeof CurrentLocationDot> = {
  component: CurrentLocationDot,
  title: 'Components/CurrentLocationDot',
};
export default meta;

type Story = StoryObj<typeof CurrentLocationDot>;

export const LocationDot: Story = {
  render: (args) => <CurrentLocationDot />,
};
