import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './buttons';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const FloatingLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: () => <Button variant="floating-light">Button</Button>,
};

export const FloatingDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: () => <Button variant="floating-dark">Button</Button>,
};

export const Playground: Story = {
  render: (args) => (
    <Button
      {...args}
      leftIcon={args.leftIcon ? <FaPlay /> : undefined}
      rightIcon={args.rightIcon ? <FaArrowRight /> : undefined}
    />
  ),
  args: {
    variant: 'floating-light',
    children: 'Button',
    leftIcon: false,
    rightIcon: false,
  },
};
