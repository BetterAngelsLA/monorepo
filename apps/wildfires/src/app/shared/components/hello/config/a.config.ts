import { TSection } from '../types';

export const sectionA: TSection = {
  id: 'sectionA',
  title: 'title: section A (2 questions)',
  questions: [
    {
      id: 'a_1',
      type: 'radio',
      question: 'first question',
      options: [
        {
          optionId: 'a_1_yes',
          label: 'Yes',
        },
        {
          optionId: 'a_1_no',
          label: 'No',
        },
      ],
    },
    {
      id: 'a_2',
      question: 'second question',
      type: 'radio',
      options: [
        {
          optionId: 'a_2_yes',
          label: 'Yes',
        },
        {
          optionId: 'a_2_no',
          label: 'No',
        },
      ],
    },
  ],
};
