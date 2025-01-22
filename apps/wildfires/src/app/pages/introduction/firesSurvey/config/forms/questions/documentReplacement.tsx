import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qDocumentReplacement: TQuestion = {
  id: 'qDocumentReplacement',
  type: 'checkbox',
  title: 'Which of the following items (if any) do you need replaced?',
  subtitle: '(Select all that apply)',
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
};
