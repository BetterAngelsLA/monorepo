import {
  ClientDocumentNamespaceEnum,
  GenderEnum,
  HmisAgencyEnum,
  LanguageEnum,
  LivingSituationEnum,
  RelationshipTypeEnum,
  YesNoPreferNotToSayEnum,
} from '../apollo';

export const enumDisplayLanguage: { [key in LanguageEnum]: string } = {
  [LanguageEnum.Arabic]: 'Arabic',
  [LanguageEnum.Armenian]: 'Armenian',
  [LanguageEnum.SimplifiedChinese]: 'Chinese, Simplified',
  [LanguageEnum.TraditionalChinese]: 'Chinese, Traditional',
  [LanguageEnum.English]: 'English',
  [LanguageEnum.Farsi]: 'Farsi',
  [LanguageEnum.Indonesian]: 'Indonesian',
  [LanguageEnum.Japanese]: 'Japanese',
  [LanguageEnum.Khmer]: 'Khmer',
  [LanguageEnum.Korean]: 'Korean',
  [LanguageEnum.Russian]: 'Russian',
  [LanguageEnum.Spanish]: 'Spanish',
  [LanguageEnum.Tagalog]: 'Tagalog',
  [LanguageEnum.Vietnamese]: 'Vietnamese',
};

export const enumDisplayLivingSituation: {
  [key in LivingSituationEnum]: string;
} = {
  [LivingSituationEnum.Housing]: 'Housing',
  [LivingSituationEnum.Shelter]: 'Shelter',
  [LivingSituationEnum.Vehicle]: 'Vehicle',
  [LivingSituationEnum.Tent]: 'Tent',
  [LivingSituationEnum.OpenAir]: 'Open Air',
  [LivingSituationEnum.Other]: 'Other',
};

export const enumDisplayHmisAgency: {
  [key in HmisAgencyEnum]: string;
} = {
  [HmisAgencyEnum.Lahsa]: 'LAHSA',
  [HmisAgencyEnum.SantaMonica]: 'Santa Monica',
  [HmisAgencyEnum.Pasadena]: 'Pasadena',
  [HmisAgencyEnum.Champ]: 'CHAMP',
  [HmisAgencyEnum.Vash]: 'VASH',
};

export const enumDisplayGender: { [key in GenderEnum]: string } = {
  [GenderEnum.Female]: 'Female',
  [GenderEnum.Male]: 'Male',
  [GenderEnum.Other]: 'Other',
  [GenderEnum.NonBinary]: 'Non-Binary',
  [GenderEnum.PreferNotToSay]: 'Prefer not to say',
};

export const enumDisplayDocumentType: {
  [key in ClientDocumentNamespaceEnum]: string;
} = {
  [ClientDocumentNamespaceEnum.BirthCertificate]: 'Birth Certificate',
  [ClientDocumentNamespaceEnum.ConsentForm]: 'Consent Form',
  [ClientDocumentNamespaceEnum.DriversLicenseBack]: `Driver's License Back`,
  [ClientDocumentNamespaceEnum.DriversLicenseFront]: `Driver's License Front`,
  [ClientDocumentNamespaceEnum.HmisForm]: 'HMIS Form',
  [ClientDocumentNamespaceEnum.IncomeForm]: 'Income Form',
  [ClientDocumentNamespaceEnum.OtherClientDocument]: 'Other',
  [ClientDocumentNamespaceEnum.OtherDocReady]: 'Other',
  [ClientDocumentNamespaceEnum.OtherForm]: 'Other Form',
  [ClientDocumentNamespaceEnum.PhotoId]: 'Photo ID',
  [ClientDocumentNamespaceEnum.SocialSecurityCard]: 'Social Security Card',
};

export const enumDisplayVeteran: { [key in YesNoPreferNotToSayEnum]: string } =
  {
    [YesNoPreferNotToSayEnum.Yes]: 'Yes',
    [YesNoPreferNotToSayEnum.No]: 'No',
    [YesNoPreferNotToSayEnum.PreferNotToSay]: 'Prefer not to say',
  };

export const clientRelationshipEnumDisplay: Partial<{
  [key in RelationshipTypeEnum]: string;
}> = {
  [RelationshipTypeEnum.Aunt]: 'Aunt',
  [RelationshipTypeEnum.Child]: 'Child',
  [RelationshipTypeEnum.Cousin]: 'Cousin',
  [RelationshipTypeEnum.Father]: 'Father',
  [RelationshipTypeEnum.Friend]: 'Friend',
  [RelationshipTypeEnum.Grandparent]: 'Grandparent',
  [RelationshipTypeEnum.Mother]: 'Mother',
  [RelationshipTypeEnum.Sibling]: 'Sibling',
  [RelationshipTypeEnum.Uncle]: 'Uncle',
  [RelationshipTypeEnum.Other]: 'Other',
};

export const clientRelevantContactEnumDisplay: Partial<{
  [key in RelationshipTypeEnum]: string;
}> = {
  [RelationshipTypeEnum.CurrentCaseManager]: 'Current Case Manager',
  ...clientRelationshipEnumDisplay,
  [RelationshipTypeEnum.PastCaseManager]: 'Past Case Manager',
  [RelationshipTypeEnum.Organization]: 'Organization',
};

export const clientHouseholdMemberEnumDisplay: Partial<{
  [key in RelationshipTypeEnum]: string;
}> = {
  ...clientRelationshipEnumDisplay,
  [RelationshipTypeEnum.Pet]: 'Pet',
};
