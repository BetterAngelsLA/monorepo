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
  parameters: {
    customLayout: {
      canvasClassName: 'h-[400px] bg-gray-100',
    },
  },
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return <StoryComponent {...baseArgs} />;
  },
};

export const WithHeaderAndFooter: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'h-[400px] bg-gray-100',
    },
  },
  render: () => (
    <StoryComponent
      {...defaultArgs}
      header={
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-primary-20">Jane Doe</p>
          <p className="text-xs text-neutral-55">jane@example.com</p>
        </div>
      }
      footer={
        <p className="text-xs text-neutral-55">Organization: Better Angels</p>
      }
    />
  ),
};
