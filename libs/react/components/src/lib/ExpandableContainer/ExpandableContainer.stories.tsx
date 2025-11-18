import { disableControls } from '@monorepo/react/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { ExpandableContainer } from './ExpandableContainer';

const meta: Meta<typeof ExpandableContainer> = {
  title: 'ExpandableContainer',
  component: ExpandableContainer,
  argTypes: {
    ...disableControls(['onClick']),
    header: {
      control: 'text', // override type
    },
  },
};
export default meta;

type Story = StoryObj;

const defaultArgs = {
  header: 'Demo Header',
  open: false,
};

export const ExpandableContainerDemo: Story = {
  render: (args) => {
    const baseArgs = { ...defaultArgs, ...args };

    return (
      <ExpandableContainer {...baseArgs} className="w-full">
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
      </ExpandableContainer>
    );
  },
};
