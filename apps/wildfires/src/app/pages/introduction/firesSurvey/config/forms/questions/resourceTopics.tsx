import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qResourceTopics: TQuestion = {
  id: 'qResourceTopics',
  type: 'checkbox',
  title: 'What help do you need?',
  subtitle: '(Choose as many as you like)',
  options: [
    {
      optionId: 'resourceMailForwarding',
      label: 'Mail Forwarding',
      // tags: ['General - Mail Forwarding']
      tags: ['general-mail-forwarding'],
    },
    {
      optionId: 'resourceDocumentReplacement',
      label: 'Document / ID Replacement',
    },
    {
      optionId: 'resourceFinancial',
      label: 'Income Loss Support',
      // tags: ['General - Financial Assistance']
      tags: ['general-financial-assistance'],
    },
    {
      optionId: 'resourceHousing',
      label: 'Housing, Shelter, and Repair',
      // tags: ['General - Housing Resources']
      tags: ['general-housing-resources'],
    },
    {
      optionId: 'resourceBusiness',
      label: 'Support for your Business',
      // tags: ['General - Business Resources']
      tags: ['general-business-resources'],
    },
    {
      optionId: 'resourceFood',
      label: 'Food and Essential Items',
      // tags: ['General - Food']
      tags: ['general-food'],
    },
    {
      optionId: 'resourceHealthcare',
      label: 'Healthcare & Mental Health Resources',
      // tags: ['General - Health']
      tags: ['general-health'],
    },
    {
      optionId: 'resourceChildcare',
      label: 'Family: Childcare & School Information',
      // tags: ['General - Childcare']
      tags: ['general-childcare'],
    },
    {
      optionId: 'resourcePets',
      label: 'Pet Resources',
      // tags: ['General - Pet']
      tags: ['general-pet'],
    },
    {
      optionId: 'resourceReunification',
      label: 'Reunification / Missing Persons',
      // tags: ['General - Reunification']
      tags: ['general-reunification'],
    },
    {
      optionId: 'resourceImmigration',
      label: 'Immigrant Related Information',
      // tags: ['General - Immigrant-Related']
      tags: ['general-immigrant-related'],
    },
    {
      optionId: 'resourceInPersonSupport',
      label: 'In-Person Support',
      // tags: ['General - In-Person Support']
      tags: ['general-in-person-support'],
    },
  ],
  rules: {
    required: true,
  },
};
