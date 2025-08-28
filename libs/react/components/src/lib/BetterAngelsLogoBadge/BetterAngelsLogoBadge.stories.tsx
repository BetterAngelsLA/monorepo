import type { Meta, StoryObj } from '@storybook/react';
import { BetterAngelsLogoBadge as StoryComponent } from './BetterAngelsLogoBadge';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/BetterAngelsLogoBadge',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

export const BetterAngelsLogoBadge: Story = {
  render: (args) => <StoryComponent {...args} />,
};
