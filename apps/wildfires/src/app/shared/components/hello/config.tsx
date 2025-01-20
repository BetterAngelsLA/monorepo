import { TQuestionnaire, TSection } from './types';

const sections: TSection[] = [
  {
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
    next: 'sectionB',
  },
  {
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
    next: 'sectionC',
  },
  {
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
  },
];

export const config: TQuestionnaire = {
  sections: sections,
};
