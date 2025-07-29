import { SelectButton } from './SelectButton';

export default {
  title: 'SelectButton',
  component: SelectButton,
  args: {
    defaultLabel: 'All',
    selected: [],
    onPress: () => console.log('Button Pressed'),
  },
};

export const Default = {
  args: {
    defaultLabel: 'All',
    selected: [],
  },
};

export const SingleSelected = {
  args: {
    selected: ['Team A'],
  },
};

export const MultipleSelected = {
  args: {
    selected: ['Team A', 'Team B', 'Team C'],
  },
};

export const AllSelected = {
  args: {
    selected: ['All'],
  },
};
