import { TSection } from '../types';

export const stepperSection: TSection = {
  id: 'stepperSection',
  title: 'title: stepper section',
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
      next: 'c_2',
    },
    {
      id: 'c_2',
      type: 'radio',
      question: 'second question',
      options: [
        {
          optionId: 'c_2_yes',
          label: 'Go to 2A',
        },
        {
          optionId: 'c_3_no',
          label: 'Go to 2B',
        },
      ],
      next: {
        c_2_yes: 'c_2_A',
        c_3_no: 'c_2_B',
      },
    },
    {
      id: 'c_2_A',
      type: 'radio',
      question: 'I am 2A',
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
    {
      id: 'c_2_B',
      type: 'radio',
      question: 'I am 2B',
      options: [
        {
          optionId: 'c_2_yes',
          label: 'hello',
        },
        {
          optionId: 'c_3_no',
          label: 'world',
        },
      ],
    },
  ],
};
