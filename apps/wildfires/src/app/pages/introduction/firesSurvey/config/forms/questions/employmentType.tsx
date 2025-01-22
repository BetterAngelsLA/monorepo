import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qEmploymentType: TQuestion = {
  id: 'qEmploymentType',
  type: 'checkbox',
  title:
    'Are you employed by a company, or do you work for yourself as a freelancer or self-employed professional?',
  options: [
    {
      optionId: 'employmentCompany',
      label: 'Employed by a Company',
    },
    {
      optionId: 'employmentSelfEmployed',
      label: 'Self-Employed',
    },
    {
      optionId: 'employmentFreelance',
      label: 'Freelance worker',
    },
  ],
  rules: {
    required: true,
  },
};
