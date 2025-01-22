import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qHaveOwnersInsurance: TQuestion = {
  id: 'qHaveOwnersInsurance',
  type: 'radio',
  title: 'Do you have Owner’s Insurance? ',
  options: [
    {
      optionId: 'yes',
      label: 'Yes',
    },
    {
      optionId: 'no',
      label: 'No',
    },
  ],
  rules: {
    required: true,
  },
};
