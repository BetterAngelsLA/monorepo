import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qEmploymentType: TQuestion = {
  id: 'qEmploymentType',
  type: 'checkbox',
  title:
    'Do you have a job or are you a SELF-EMPLOYED/FREELANCE worker?',
  options: [
    {
      optionId: 'employmentCompany',
      label: 'Employed by a Company',
      // No Slugs or tags
    },
    {
      optionId: 'employmentSelfEmployedFreelance',
      label: 'Self-Employed/Freelance',
      // tags: ['Income - Self-Employed/Freelance']
      // slugs: ['income-self-employed-freelance']
    }
  ],
  rules: {
    required: true,
  },
};
