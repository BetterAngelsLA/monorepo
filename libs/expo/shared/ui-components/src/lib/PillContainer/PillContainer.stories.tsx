import type { Meta, StoryObj } from '@storybook/react';
import { PillContainer } from './PillContainer';

const meta: Meta<typeof PillContainer> = {
  title: 'PillContainer',
  component: PillContainer,
  args: {
    type: 'success',
    data: [
      'Service 1',
      'Service 2',
      'Service 3',
      'Service 4',
      'Service 5',
      'Service 6',
      'Service 7',
      'Service 8',
    ],
    maxVisible: 5,
  },
};

export default meta;

type PillContainerStory = StoryObj<typeof PillContainer>;

export const Basic: PillContainerStory = {
  args: {
    type: 'success',
  },
};
