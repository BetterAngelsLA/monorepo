import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qRentOrOwn: TQuestion = {
  id: 'qRentOrOwn',
  type: 'radio',
  title: 'Do you RENT or OWN your home?',
  options: [
    {
      optionId: 'rent',
      label: 'Rent',
    },
    {
      optionId: 'own',
      label: 'Own',
    },
  ],
  rules: {
    required: true,
  },
};
