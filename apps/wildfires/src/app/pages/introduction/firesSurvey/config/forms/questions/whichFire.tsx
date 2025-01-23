import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qWhichFire: TQuestion = {
  id: 'qWhichFire',
  type: 'checkbox',
  title: 'What fire impacted you?',
  subtitle: '(Select all that apply)',
  options: [
    {
      optionId: 'palisadesFire',
      label: 'Palisades',
    },
    {
      optionId: 'eatonFire',
      label: 'Eaton',
    },
    {
      optionId: 'kennethFire',
      label: 'Kenneth',
    },
    {
      optionId: 'hughesFire',
      label: 'Hughes',
    },
    {
      optionId: 'hurstFire',
      label: 'Hurst',
    },
    {
      optionId: 'otherFire',
      label: 'Other',
    },
  ],
  rules: {
    required: false,
  },
};
