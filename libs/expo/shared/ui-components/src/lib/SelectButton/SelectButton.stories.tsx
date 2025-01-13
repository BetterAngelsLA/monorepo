import type { Meta, StoryObj } from '@storybook/react';
import { SelectButton } from './SelectButton';

const meta: Meta<typeof SelectButton> = {
  title: 'SelectButton',
  component: SelectButton,
  args: {
    defaultLabel: 'All',
    selected: [],
    onPress: () => console.log('Button Pressed'),
  },
};

export default meta;

type SelectButtonStory = StoryObj<typeof SelectButton>;

export const Default: SelectButtonStory = {
  args: {
    defaultLabel: 'All',
    selected: [],
  },
};

export const SingleSelected: SelectButtonStory = {
  args: {
    selected: ['Team A'],
  },
};

export const MultipleSelected: SelectButtonStory = {
  args: {
    selected: ['Team A', 'Team B', 'Team C'],
  },
};

export const AllSelected: SelectButtonStory = {
  args: {
    selected: ['All'],
  },
};
