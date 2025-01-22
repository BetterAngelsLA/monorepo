import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qTempHousing: TQuestion = {
  id: 'qTempHousing',
  type: 'radio',
  title: 'Do you need a temporary housing?',
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
