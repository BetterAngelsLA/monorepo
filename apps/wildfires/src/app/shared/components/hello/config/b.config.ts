import { TSection } from '../types';

export const sectionB: TSection = {
  id: 'sectionB',
  title: 'title: section B (1 question)',
  questions: [
    {
      id: 'b_1',
      type: 'radio',
      question: 'one question',
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
  ],
};
