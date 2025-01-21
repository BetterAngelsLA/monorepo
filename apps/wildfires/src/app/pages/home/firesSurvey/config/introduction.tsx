import { TFormBase } from 'apps/wildfires/src/app/shared/components/survey/types';

export const introductionForm: TFormBase = {
  id: 'introductionForm',
  title: 'Introduction',
  questions: [
    {
      id: 'wildfireNames',
      type: 'checkbox',
      question: 'What fire impacted you?',
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
          label: 'Kennet',
        },
        {
          optionId: 'hurtsFire',
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
    },
    {
      id: 'resourcesNeeded',
      type: 'checkbox',
      question: 'Which of the following resources do you need? ',
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
    },
  ],
};
