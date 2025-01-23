import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qDocumentReplacement: TQuestion = {
  id: 'qDocumentReplacement',
  type: 'checkbox',
  title: 'Which of the following items do you need replaced?',
  subtitle: '(Choose as many as you like)',
  options: [
    {
      optionId: 'vitalRecords',
      label: 'Records (birth/death certificate, marriage license)',
      // tags: ['Document Replacement - Vital Records'],
      // slugs: ['document-replacement-vital-records']
    },
    {
      optionId: 'socialSecurityCards',
      label: 'Social Security Cards',
      // tags:['Document Replacement - Social Security Cards']
      // slugs: ['document-replacement-social-security-cards']
    },
    {
      optionId: 'driversLicenseIds',
      label: "Driver's Licenses or ID's",
      // tags: ['Document Replacement - ID']
      // slugs: ['document-replacement-id']
    },
    {
      optionId: 'passport',
      label: 'Passport',
      // tags: ['Document Replacement - Passport']
      // slugs: ['document-replacement-passport']
    },
    {
      optionId: 'otherDocuments',
      label: 'Other / I’m not sure',
      // tags: ['Document Replacement - Other']
      // slugs: ['document-replacement-other']
    },
  ],
  rules: {
    required: true,
  },
};
