import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './buttons';

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
  title: 'Dropdown',
};
export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Dropdown: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
    },
  },
  render: () => <Dropdown>Button</Dropdown>,
};
