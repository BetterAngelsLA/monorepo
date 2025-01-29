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
      // tags: ['Income - Job Loss']
      tags: ['income-job-loss'],
    },
    {
      optionId: 'employmentSelfEmployedFreelance',
      label: 'Self-Employed / Freelance',
      // tags: ['Income - Self-Employed/Freelance']
      tags: ['income-self-employed-freelance'],
    },
    {
      optionId: 'employmentDomesticWorkerDayLaborer',
      label: 'Domestic Worker / Day Laborer',
      // tags: ['Income - Self-Employed/Freelance']
      tags: ['income-job-loss'],
    },
    {
      optionId: 'employmentMultipleJobs',
      label: 'I have multiple jobs',
      // tags: ['Income - Self-Employed/Freelance']
      tags: ['income-job-loss'],
    },
    {
      optionId: 'employmentNoneOfTheAbove',
      label: 'None of the above',
    },
  ],
  rules: {
    required: true,
  },
};
