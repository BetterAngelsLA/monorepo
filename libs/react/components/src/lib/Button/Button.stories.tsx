import type { Meta, StoryObj } from '@storybook/react';
import { ListDecorator } from '../../storybook';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Components/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const BasicButton: Story = {
  render: (args) => (
    <ListDecorator>
      <Button {...args}>text</Button>
      <Button {...args} className="pseudo-hover">
        hover
      </Button>
      <Button {...args} className="pseudo-active">
        active
      </Button>
    </ListDecorator>
  ),
};
