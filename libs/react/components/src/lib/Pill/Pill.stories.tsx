import type { Meta, StoryObj } from '@storybook/react';
import { IPillProps, Pill as StoryComponent } from './Pill';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/Pill',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: IPillProps = {
  type: 'success',
  label: 'Hello Pill',
};

export const Pill: Story = {
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return <StoryComponent {...baseArgs} />;
  },
};
