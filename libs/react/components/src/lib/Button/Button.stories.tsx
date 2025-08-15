import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const BasicButton: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Button {...args}>text</Button>
      <Button {...args} className="pseudo-hover">
        hover
      </Button>
      <Button {...args} className="pseudo-active">
        active
      </Button>
    </div>
  ),
};
