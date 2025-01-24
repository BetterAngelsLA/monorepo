import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qIsSmallBusiness: TQuestion = {
  id: 'qIsSmallBusiness',
  type: 'radio',
  title: 'Does your business qualify as a SMALL BUSINESS',
  options: [
    {
      optionId: 'smallBusinessYes',
      label: 'Yes',
      // tags: ['Business - Small Business']
      tags: ['business-small-business'],
    },
    {
      optionId: 'smallBusinessNo',
      label: 'No',
    },
  ],
  rules: {
    required: true,
  },
};
