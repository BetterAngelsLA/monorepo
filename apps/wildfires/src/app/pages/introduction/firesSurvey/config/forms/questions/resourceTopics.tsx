import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qResourceTopics: TQuestion = {
  id: 'qResourceTopics',
  type: 'checkbox',
  title: 'Which resources would you like to learn about?',
  subtitle: '(Choose as many as you like)',
  options: [
    {
      optionId: 'resourceMailForwarding',
      label: 'Mail Forwarding'
      // tags: ['General - Mail Forwarding']
      // slugs: ['general-mail-forwarding']
    },
    {
      optionId: 'resourceDocumentReplacement',
      label: 'Document / ID Replacement',
    },
    {
      optionId: 'resourceFinancial',
      label: 'Financial / Income Loss Resources',
      // tags: ['General - Financial Assistance']
      // slugs: ['general-financial-assistance']
    },
    {
      optionId: 'resourceHousing',
      label: 'Housing / Shelter Resources'
      // tags: ['General - Housing Resources']
      // slugs: ['general-housing-resources']
    },
    {
      optionId: 'resourceBusiness',
      label: 'Support for Businesses'
      // tags: ['General - Business Resources']
      // slugs: ['general-business-resources']
    },
    {
      optionId: 'resourceFood',
      label: 'Food Resources'
      // tags: ['General - Food']
      // slugs: ['general-food']
    },
    {
      optionId: 'resourceHealthcare',
      label: 'Healthcare & Mental Health Resources',
      // tags: ['General - Health']
      // slugs: ['general-health']
    },
    {
      optionId: 'resourceChildcare',
      label: 'Childcare'
      // tags: ['General - Childcare']
      // slugs: ['general-childcare']
    },
    {
      optionId: 'resourcePets',
      label: 'Pet Resources'
      // tags: ['General - Pet']
      // slugs: ['general-pet']
    },
    {
      optionId: 'resourceReunification',
      label: 'Reunification/Missing Persons',
      // tags: ['General - Reunification']
      // slugs: ['general-reunification']
    },
    {
      optionId: 'resourceImmigration',
      label: 'Immigrant-Related Info'
      // tags: ['General - Immigrant-Related']
      // slugs: ['general-immigrant-related']
    },
    {
      optionId: 'resourceInPersonSupport',
      label: 'In-Person Support'
      // tags: ['General - In-Person Support']
      // slugs: ['general-in-person-support']
    },
  ],
  rules: {
    required: true,
  },
};
