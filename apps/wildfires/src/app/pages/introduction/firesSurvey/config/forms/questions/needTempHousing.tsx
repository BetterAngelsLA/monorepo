import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qTempHousing: TQuestion = {
  id: 'qTempHousing',
  type: 'radio',
  title: 'Do you need TEMPORARY HOUSING?',
  options: [
    {
      optionId: 'temporaryHousingYes',
      label: 'Yes',
      // tags: ['Housing - Temporary Housing']
      tags: ['housing-temporary-housing'],
    },
    {
      optionId: 'temporaryHousingNo',
      label: 'No',
      tags: ['housing-no-temporary-housing'],
    },
  ],
  rules: {
    required: true,
  },
};
