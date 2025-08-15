import type { Meta, StoryObj } from '@storybook/react';
import { SbList } from '../../storybook';
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
      <SbList className="w-[400px] p-8 border-2 border-gray-100">
        <StoryComponent {...baseArgs} />
      </SbList>
    );
  },
};
