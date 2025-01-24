export enum ResourceTagCategoryEnum {
  DocumentReplacement = 'DOCUMENT_REPLACEMENT',
  BusinessAssistance = 'BUSINESS_ASSISTANCE',
  Insurance = 'INSURANCE',
  FinancialAssistanceIndividualsFamilies = 'FINANCIAL_ASSISTANCE_INDIVIDUALS_FAMILIES',
  HousingAndFood = 'HOUSING_AND_FOOD',
  ForwardMail = 'FORWARD_MAIL',
  Immigrant = 'IMMIGRANT',
  General = 'GENERAL',
  UsefulLinks = 'USEFUL_LINKS',
  MentalHealthAndPets = 'MENTAL_HEALTH_AND_PETS',
  FamiliesWithChildren = 'FAMILIES_WITH_CHILDREN',
}

export const ResourceTagCategoryLabelEnum = {
  [ResourceTagCategoryEnum.DocumentReplacement]: 'Document Replacement',
  [ResourceTagCategoryEnum.BusinessAssistance]: 'Business Assistance',
  [ResourceTagCategoryEnum.Insurance]: 'Insurance',
  [ResourceTagCategoryEnum.FinancialAssistanceIndividualsFamilies]:
    'Financial Assistance for Individuals & Families',
  [ResourceTagCategoryEnum.HousingAndFood]: 'Housing & Food',
  [ResourceTagCategoryEnum.ForwardMail]: 'Forward Mail',
  [ResourceTagCategoryEnum.Immigrant]: 'Immigrant',
  [ResourceTagCategoryEnum.General]: 'General',
  [ResourceTagCategoryEnum.UsefulLinks]: 'Useful Links',
  [ResourceTagCategoryEnum.MentalHealthAndPets]: 'Mental Health & Pets',
  [ResourceTagCategoryEnum.FamiliesWithChildren]: 'Families with Children',
};

type TTagsByCategory = Record<ResourceTagCategoryEnum, string[]>;

export const tagsByCategory: TTagsByCategory = {
  [ResourceTagCategoryEnum.DocumentReplacement]: [
    'document-replacement-other',
    'document-replacement-income-tax',
    'document-replacement-mobile-home',
    'document-replacement-passport',
    'document-replacement-id',
    'document-replacement-social-security-cards',
    'document-replacement-vital-records',
  ],
  [ResourceTagCategoryEnum.BusinessAssistance]: [
    'business-small-business',
    'general-business-resources',
  ],
  [ResourceTagCategoryEnum.Insurance]: [
    'housing-renter-with-insurance',
    'housing-owner-with-insurance',
  ],
  [ResourceTagCategoryEnum.FinancialAssistanceIndividualsFamilies]: [
    'housing-no-insurance',
    'general-housing-resources',
    'income-low-income',
    'income-self-employed-freelance',
    'income-job-loss',
    'general-financial-assistance',
  ],
  [ResourceTagCategoryEnum.HousingAndFood]: [
    'housing-temporary-housing',
    'housing-home-owner',
    'general-food',
  ],
  [ResourceTagCategoryEnum.ForwardMail]: ['general-mail-forwarding'],
  [ResourceTagCategoryEnum.Immigrant]: ['general-immigrant-related'],
  [ResourceTagCategoryEnum.General]: ['general-for-all'],
  [ResourceTagCategoryEnum.UsefulLinks]: [
    'general-in-person-support',
    'general-reunification',
  ],
  [ResourceTagCategoryEnum.MentalHealthAndPets]: [
    'general-pet',
    'general-health',
  ],
  [ResourceTagCategoryEnum.FamiliesWithChildren]: ['general-childcare'],
} as const;
