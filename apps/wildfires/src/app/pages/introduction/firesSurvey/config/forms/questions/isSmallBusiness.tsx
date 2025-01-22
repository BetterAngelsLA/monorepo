import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qIsSmallBusiness: TQuestion = {
  id: 'qIsSmallBusiness',
  type: 'radio',
  title: 'Does your business qualify as a  SMALL BUSINESS',
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
