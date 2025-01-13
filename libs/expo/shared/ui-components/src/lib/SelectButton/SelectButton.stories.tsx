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
    selected: [{ id: 'team_a', label: 'Team A' }],
  },
};

export const MultipleSelected: SelectButtonStory = {
  args: {
    selected: [
      { id: 'team_a', label: 'Team A' },
      { id: 'team_b', label: 'Team B' },
      { id: 'team_c', label: 'Team C' },
    ],
  },
};

export const AllSelected: SelectButtonStory = {
  args: {
    selected: [{ id: 'all', label: 'All' }],
  },
};
