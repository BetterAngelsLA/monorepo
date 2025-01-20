import { TSection } from '../types';

export const sectionC: TSection = {
  id: 'sectionC',
  title: 'title: section C (2 question)',
  stepper: true,
  questions: [
    {
      id: 'c_1',
      type: 'radio',
      question: 'first question',
      options: [
        {
          optionId: 'c_1_yes',
          label: 'Yes',
        },
        {
          optionId: 'c_1_no',
          label: 'No',
        },
      ],
    },
    {
      id: 'c_2',
      type: 'radio',
      question: 'second question',
      options: [
        {
          optionId: 'c_2_yes',
          label: 'Yes',
        },
        {
          optionId: 'c_3_no',
          label: 'No',
        },
      ],
    },
  ],
};
