import type { Meta, StoryObj } from '@storybook/react';
import ArrowLeftIcon from './ArrowLeftIcon';

const meta: Meta<typeof ArrowLeftIcon> = {
  component: ArrowLeftIcon,
  title: 'Icons/ArrowLeftIcon',
};
export default meta;

type Story = StoryObj<typeof ArrowLeftIcon>;

export const ArrowLeftIconStory: Story = {
  render: (args) => {
    return <ArrowLeftIcon {...args} className="h-12" />;
  },
};
