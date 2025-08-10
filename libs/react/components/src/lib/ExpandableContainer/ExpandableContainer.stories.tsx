import type { Meta, StoryObj } from '@storybook/react';
import { disableControls } from '../../storybook';
import { ExpandableContainer } from './ExpandableContainer';

const meta: Meta<typeof ExpandableContainer> = {
  title: 'Components/ExpandableContainer',
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
      <ExpandableContainer {...baseArgs}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
      </ExpandableContainer>
    );
  },
};
