import type { Meta, StoryObj } from '@storybook/react';
import { Pill } from './Pill';

const meta: Meta<typeof Pill> = {
  title: 'Pill',
  component: Pill,
  args: {
    color: 'green',
  },
};

export default meta;

type PillStory = StoryObj<typeof Pill>;

export const Basic: PillStory = {
  args: {
    color: 'green',
  },
};
