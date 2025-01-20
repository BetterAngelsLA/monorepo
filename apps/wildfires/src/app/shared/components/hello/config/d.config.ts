import { TSection } from '../types';

export const sectionD: TSection = {
  id: 'sectionD',
  title: 'title: section D (2 questions)',
  questions: [
    {
      id: 'b_1',
      type: 'radio',
      question: 'first question',
      options: [
        {
          optionId: 'b_1_yes',
          label: 'Yes',
        },
        {
          optionId: 'b_1_no',
          label: 'No',
        },
      ],
    },
    {
      id: 'b_2',
      question: 'second question',
      type: 'radio',
      options: [
        {
          optionId: 'b_2_yes',
          label: 'Yes',
        },
        {
          optionId: 'b_2_no',
          label: 'No',
        },
      ],
    },
  ],
};
