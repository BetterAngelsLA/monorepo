import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from './buttons';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

// ARROW

export const RightArrow: Story = {
  render: () => (
    <Button
      variant="rightarrow"
      leftIcon={<ArrowRight size={24} stroke="black" />}
      rightIcon={null}
    />
  ),
};

// EDIT ICONS

export const EditLight: Story = {
  render: () => (
    <Button
      variant="editlight"
      leftIcon={<Pencil size={22} stroke="black" />}
      rightIcon={null}
    />
  ),
};

export const EditGhost: Story = {
  render: () => (
    <Button
      variant="editlight"
      leftIcon={<Pencil size={22} stroke="#747A82" />}
      rightIcon={null}
    />
  ),
};

export const EditMedium: Story = {
  render: () => (
    <Button
      variant="editmedium"
      leftIcon={<Pencil size={22} stroke="black" />}
      rightIcon={null}
    />
  ),
};

export const EditDark: Story = {
  render: () => (
    <Button
      variant="editdark"
      leftIcon={<Pencil size={22} stroke="black" />}
      rightIcon={null}
    />
  ),
};

// TRASH BUTTONS
export const TrashLight: Story = {
  render: () => (
    <Button
      variant="trashlight"
      leftIcon={<Trash2 size={22} stroke="#CB0808" />}
      rightIcon={null}
    />
  ),
};

export const TrashGhost: Story = {
  render: () => (
    <Button
      variant="trashlight"
      leftIcon={<Trash2 size={22} stroke="#747A82" />}
      rightIcon={null}
    />
  ),
};

export const TrashMedium: Story = {
  render: () => (
    <Button
      variant="trashmedium"
      leftIcon={<Trash2 size={22} stroke="#CB0808" />}
      rightIcon={null}
    />
  ),
};

export const TrashDark: Story = {
  render: () => (
    <Button
      variant="trashdark"
      leftIcon={<Trash2 size={22} stroke="#CB0808" />}
      rightIcon={null}
    />
  ),
};

// SMALL BUTTONS

export const SmallLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="smalllight">Button</Button>,
};

export const SmallMedium: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="smallmedium">Button</Button>,
};

export const SmallDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="smalldark">Button</Button>,
};

export const FloatingLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
    },
  },
  render: () => <Button variant="floating-light">Button</Button>,
};

export const FloatingDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
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
