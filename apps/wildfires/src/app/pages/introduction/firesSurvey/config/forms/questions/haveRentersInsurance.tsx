import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qHaveRentersInsurance: TQuestion = {
  id: 'qHaveRentersInsurance',
  type: 'radio',
  title: 'Do you have Renter’s Insurance? ',
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
