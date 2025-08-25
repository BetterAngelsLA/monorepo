import type { Meta, StoryObj } from '@storybook/react';
import { CurrentLocationDot as StoryComponent } from './CurrentLocationDot';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/CurrentLocationDot',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

export const CurrentLocationDot: Story = {
  render: (args) => <StoryComponent />,
};
