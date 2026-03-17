import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from './buttons';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Base UI/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

// ARROW

export const RightArrow: Story = {
  render: () => <Button variant="right-arrow" />,
};

// EDIT BUTTONS

export const Edit: Story = {
  render: () => <Button variant="edit" />,
};

// TRASH BUTTONS

export const Trash: Story = {
  render: () => <Button variant="trash" />,
};

// SMALL BUTTONS

export const Primary: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="primary">Button</Button>,
};

export const PrimaryBlue: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => (
    <Button variant="primary" color="blue">
      Button
    </Button>
  ),
};

export const PrimaryDisabled: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => (
    <Button variant="primary" disabled>
      Button
    </Button>
  ),
};

// FLOATING BUTTONS

export const Floating: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
    },
  },
  render: () => <Button variant="floating">Button</Button>,
};

// PLAYGROUND

export const Playground: Story = {
  render: (args: typeof meta.args) => (
    <Button
      {...args}
      leftIcon={args?.leftIcon ? <Plus /> : undefined}
      rightIcon={args?.rightIcon ? <Plus /> : undefined}
    />
  ),
  args: {
    variant: 'primary',
    children: 'Button',
    leftIcon: false,
    rightIcon: false,
  },
};
