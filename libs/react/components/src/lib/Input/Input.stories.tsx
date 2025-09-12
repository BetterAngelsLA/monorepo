import type { Meta, StoryObj } from '@storybook/react';
import { IInputProps, Input as StoryComponent } from './Input';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Form-Ui/Input',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: IInputProps = {
  label: 'Name',
};

export const Input: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'w-[400px]',
    },
  },
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return <StoryComponent {...baseArgs} />;
  },
};
