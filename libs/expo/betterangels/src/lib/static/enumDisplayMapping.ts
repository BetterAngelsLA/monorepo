import {
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

export const enumDisplayVeteran: { [key in YesNoPreferNotToSayEnum]: string } =
  {
    [YesNoPreferNotToSayEnum.Yes]: 'Yes',
    [YesNoPreferNotToSayEnum.No]: 'No',
    [YesNoPreferNotToSayEnum.PreferNotToSay]: 'Prefer not to say',
  };

export const enumDisplayRelevant: { [key in RelationshipTypeEnum]: string } = {
  [RelationshipTypeEnum.CurrentCaseManager]: 'Current Case Manager',
  [RelationshipTypeEnum.Aunt]: 'Aunt',
  [RelationshipTypeEnum.Child]: 'Child',
  [RelationshipTypeEnum.Cousin]: 'Cousin',
  [RelationshipTypeEnum.Father]: 'Father',
  [RelationshipTypeEnum.Friend]: 'Friend',
  [RelationshipTypeEnum.Grandparent]: 'Grandparent',
  [RelationshipTypeEnum.Mother]: 'Mother',
  [RelationshipTypeEnum.Organization]: 'Organization',
  [RelationshipTypeEnum.PastCaseManager]: 'Past Case Manager',
  [RelationshipTypeEnum.Pet]: 'Pet',
  [RelationshipTypeEnum.Sibling]: 'Sibling',
  [RelationshipTypeEnum.Uncle]: 'Uncle',
  [RelationshipTypeEnum.Other]: 'Other',
};
