import { PillContainer } from './PillContainer';

export default {
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

// Basic story inherits all of the above args
export const Basic = {};
