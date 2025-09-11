import type { Meta, StoryObj } from '@storybook/react';
import { PillContainer } from './PillContainer';

const meta: Meta<typeof PillContainer> = {
  title: 'React Native/Pills/PillContainer',
  component: PillContainer,
  args: {
    variant: 'expandable',
    pills: [
      'Service 1',
      'Service 2',
      'Service 3',
      'Service 4',
      'Service 5',
      'Service 6',
      'Service 7',
      'Service 8',
    ],
    maxVisible: 3,
  },
};

export default meta;

type PillContainerStory = StoryObj<typeof PillContainer>;

export const Basic: PillContainerStory = {
  args: {
    variant: 'expandable',
  },
};
