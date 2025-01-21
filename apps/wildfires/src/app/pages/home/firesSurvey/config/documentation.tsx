import { TFormBase } from 'apps/wildfires/src/app/shared/components/survey/types';

export const documentationForm: TFormBase = {
  id: 'documentationForm',
  title: 'Documentation',
  questions: [
    {
      id: 'replaceItems',
      type: 'checkbox',
      question: 'Which of the following items (if any) do you need replaced?',
      options: [
        {
          optionId: 'generalRecords',
          label: 'Records (Birth/death certificate, marriage license)',
        },
        {
          optionId: 'socialSecurityCards',
          label: 'Social Security Cards',
        },
        {
          optionId: 'driversLicenseIds',
          label: "Driver's Licenses or ID's",
        },
        {
          optionId: 'passport',
          label: 'Passport',
        },
      ],
      rules: {
        required: true,
      },
    },
  ],
};
