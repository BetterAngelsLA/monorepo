import { SbkPanel } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { IInputProps, Input as StoryComponent } from './Input';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Components/Form-Ui/Input',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: IInputProps = {
  label: 'Name',
};

export const Input: Story = {
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return (
      <SbkPanel variant="bordered" className="w-[400px]">
        <StoryComponent {...baseArgs} />
      </SbkPanel>
    );
  },
};
