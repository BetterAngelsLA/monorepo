export enum ResourceTagCategoryEnum {
  ReplaceDocuments = 'REPLACE_DOCUMENTS',
  ForwardYourMail = 'FORWARD_YOUR_MAIL',
  FileInsuranceClaims = 'FILE_INSURANCE_CLAIMS',
  SecureHousing = 'SECURE_HOUSING',
  SeekFinancialAssistance = 'SEEK_FINANCIAL_ASSISTANCE',
  SeekBusinessAssistance = 'SEEK_BUSINESS_ASSISTANCE',
  OtherResources = 'OTHER_RESOURCES',
}

export const ResourceTagCategoryLabelEnum = {
  [ResourceTagCategoryEnum.ReplaceDocuments]: 'Replace Documents',
  [ResourceTagCategoryEnum.ForwardYourMail]: 'Forward Your Mail',
  [ResourceTagCategoryEnum.FileInsuranceClaims]: 'File Insurance Claims',
  [ResourceTagCategoryEnum.SecureHousing]: 'Secure Housing',
  [ResourceTagCategoryEnum.SeekFinancialAssistance]:
    'Seek Financial Assistance',
  [ResourceTagCategoryEnum.SeekBusinessAssistance]: 'Seek Business Assistance',
  [ResourceTagCategoryEnum.OtherResources]: 'Utilize These Other Resources',
};

type TTagsByCategory = Record<ResourceTagCategoryEnum, string[]>;

export const tagsByCategory: TTagsByCategory = {
  [ResourceTagCategoryEnum.ReplaceDocuments]: [
    'document-replacement-vital-records',
    'document-replacement-social-security-cards',
    'document-replacement-id',
    'document-replacement-passport',
    'document-replacement-income-tax',
    'document-replacement-mobile-home',
    'document-replacement-other',
  ],
  [ResourceTagCategoryEnum.ForwardYourMail]: ['general-mail-forwarding'],
  [ResourceTagCategoryEnum.FileInsuranceClaims]: [
    'housing-no-insurance',
    'housing-owner-with-insurance',
    'housing-renter-with-insurance',
  ],
  [ResourceTagCategoryEnum.SecureHousing]: ['housing-temporary-housing'],
  [ResourceTagCategoryEnum.SeekFinancialAssistance]: [
    'income-low-income',
    'income-job-loss',
    'income-self-employed-freelance',
    'general-food',
    'housing-home-owner',
    'general-housing-resources',
    'general-financial-assistance',
  ],
  [ResourceTagCategoryEnum.SeekBusinessAssistance]: [
    'business-small-business',
    'general-business-resources',
  ],
  [ResourceTagCategoryEnum.OtherResources]: [
    'general-childcare',
    'general-health',
    'general-pet',
    'general-reunification',
    'general-immigrant-related',
    'general-in-person-support',
  ],
};
