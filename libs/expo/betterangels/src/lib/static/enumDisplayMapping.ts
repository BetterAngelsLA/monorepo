import {
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  HmisAgencyEnum,
  LanguageEnum,
  LivingSituationEnum,
  MaritalStatusEnum,
  PronounEnum,
  RaceEnum,
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

export const enumDisplayPronoun: { [key in PronounEnum]: string } = {
  [PronounEnum.HeHimHis]: 'He/Him/His',
  [PronounEnum.SheHerHers]: 'She/Her/Hers',
  [PronounEnum.TheyThemTheirs]: 'They/Them/Theirs',
  [PronounEnum.Other]: 'Other',
};

export const enumDisplayRace: { [key in RaceEnum]: string } = {
  [RaceEnum.WhiteCaucasian]: 'White/Caucasian',
  [RaceEnum.BlackAfricanAmerican]: 'African American',
  [RaceEnum.AmericanIndianAlaskaNative]: 'American Indian/Alaska Native',
  [RaceEnum.Asian]: 'Asian',
  [RaceEnum.HispanicLatino]: 'Hispanic/Latino',
  [RaceEnum.NativeHawaiianPacificIslander]: 'Native Hawaiian/Pacific Islander',
  [RaceEnum.Other]: 'Other',
};

export const enumDisplayEyeColor: { [key in EyeColorEnum]: string } = {
  [EyeColorEnum.Blue]: 'Blue',
  [EyeColorEnum.Brown]: 'Brown',
  [EyeColorEnum.Gray]: 'Gray',
  [EyeColorEnum.Green]: 'Green',
  [EyeColorEnum.Hazel]: 'Hazel',
  [EyeColorEnum.Other]: 'Other',
};

export const enumDisplayHairColor: { [key in HairColorEnum]: string } = {
  [HairColorEnum.Brown]: 'Brown',
  [HairColorEnum.Black]: 'Black',
  [HairColorEnum.Blonde]: 'Blonde',
  [HairColorEnum.Red]: 'Red',
  [HairColorEnum.Gray]: 'Gray',
  [HairColorEnum.White]: 'White',
  [HairColorEnum.Bald]: 'Bald',
  [HairColorEnum.Other]: 'Other',
};

export const enumDisplayMaritalStatus: { [key in MaritalStatusEnum]: string } =
  {
    [MaritalStatusEnum.Single]: 'Single',
    [MaritalStatusEnum.Married]: 'Married',
    [MaritalStatusEnum.Divorced]: 'Divorced',
    [MaritalStatusEnum.Widowed]: 'Widowed',
    [MaritalStatusEnum.Separated]: 'Separated',
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
