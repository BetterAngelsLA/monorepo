import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qHaveRentersInsurance: TQuestion = {
  id: 'qHaveRentersInsurance',
  type: 'radio',
  title: 'Do you have Renter’s Insurance?',
  options: [
    {
      optionId: 'rentersInsuranceYes',
      label: 'Yes',
      // tags: ['Housing - Renter with Insurance']
      tags: ['housing-renter-with-insurance'],
    },
    {
      optionId: 'housingInsuranceNo',
      label: 'No',
      // tags: ['Housing - No Insurance']
      tags: ['housing-no-insurance'],
    },
  ],
  rules: {
    required: true,
  },
};
