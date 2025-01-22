import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qResourceTopics: TQuestion = {
  id: 'qResourceTopics',
  type: 'checkbox',
  title: 'Which of the following resources would you like to learn about?',
  subtitle: '(Select all that apply)',
  options: [
    { optionId: 'resourceMailForwarding', label: 'Mail Forwarding' },
    {
      optionId: 'resourceDocumentReplacement',
      label: 'Document/ID Replacement',
    },
    {
      optionId: 'resourceFinancial',
      label: 'Financial/Income Impact Resources',
    },
    { optionId: 'resourceHousing', label: 'Home/Housing Impact Resources' },
    { optionId: 'resourceBusiness', label: 'Business Relief' },
    { optionId: 'resourceFood', label: 'Food Resources' },
    {
      optionId: 'resourceHealthcare',
      label: 'Healthcare & Mental Health Resources',
    },
    { optionId: 'resourceChildcare', label: 'Childcare' },
    { optionId: 'resourcePets', label: 'Pet Resources' },
    {
      optionId: 'resourceMissingPersons',
      label: 'Reunification/Missing Persons',
    },
    { optionId: 'resourceImmigration', label: 'Immigration-Related Info' },
    { optionId: 'resourceInPersonSupport', label: 'In-Person Support' },
  ],
  rules: {
    required: true,
  },
};
