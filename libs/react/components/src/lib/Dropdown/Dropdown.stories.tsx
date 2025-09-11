import type { Meta, StoryObj } from '@storybook/react';
import { DropdownProps, Dropdown as StoryComponent } from './Dropdown';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Dropdown',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: DropdownProps<string> = {
  title: 'hello dropdown',
  options: ['option 1', 'option 2', 'longer option 3', 'even longer option 4'],
  onSelect: () => {},
};

export const Dropdown: Story = {
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return (
      <div className="h-[300px] px-24 py-12 bg-gray-100">
        <StoryComponent {...baseArgs} />
      </div>
    );
  },
};
