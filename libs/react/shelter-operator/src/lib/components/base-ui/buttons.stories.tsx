import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from './buttons';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const SmallLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: () => <Button variant="smalllight">Button</Button>,
};

export const SmallMedium: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: () => <Button variant="smallmedium">Button</Button>,
};

export const SmallDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex-col w-[280px]',
    },
  },
  render: () => <Button variant="smalldark">Button</Button>,
};

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
      leftIcon={args.leftIcon ? <Plus /> : undefined}
      rightIcon={args.rightIcon ? <Plus /> : undefined}
    />
  ),
  args: {
    variant: 'floating-light',
    children: 'Button',
    leftIcon: false,
    rightIcon: false,
  },
};
