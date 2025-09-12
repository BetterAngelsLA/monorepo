import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const BasicButton: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: (args) => (
    <>
      <Button {...args}>text</Button>
      <Button {...args} className="pseudo-hover">
        hover
      </Button>
      <Button {...args} className="pseudo-active">
        active
      </Button>
    </>
  ),
};
