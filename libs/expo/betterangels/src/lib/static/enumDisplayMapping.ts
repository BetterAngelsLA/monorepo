import {
  AdaAccommodationEnum,
  ClientDocumentNamespaceEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  HmisAgencyEnum,
  LanguageEnum,
  LivingSituationEnum,
  MaritalStatusEnum,
  PreferredCommunicationEnum,
  PronounEnum,
  RaceEnum,
  RelationshipTypeEnum,
  SelahTeamEnum,
  ServiceRequestTypeEnum,
  SocialMediaEnum,
  TaskStatusEnum,
  VeteranStatusEnum,
} from '../apollo';

export const enumDisplayLanguage: { [key in LanguageEnum]: string } = {
  [LanguageEnum.Arabic]: 'Arabic',
  [LanguageEnum.Armenian]: 'Armenian',
  [LanguageEnum.Asl]: 'American Sign Language',
  [LanguageEnum.Cantonese]: 'Cantonese',
  [LanguageEnum.English]: 'English',
  [LanguageEnum.Farsi]: 'Farsi',
  [LanguageEnum.French]: 'French',
  [LanguageEnum.Indonesian]: 'Indonesian',
  [LanguageEnum.Japanese]: 'Japanese',
  [LanguageEnum.Khmer]: 'Khmer',
  [LanguageEnum.Korean]: 'Korean',
  [LanguageEnum.Mandarin]: 'Mandarin',
  [LanguageEnum.Other]: 'Other',
  [LanguageEnum.Russian]: 'Russian',
  [LanguageEnum.SimplifiedChinese]: 'Chinese, Simplified',
  [LanguageEnum.Spanish]: 'Spanish',
  [LanguageEnum.Tagalog]: 'Tagalog',
  [LanguageEnum.TraditionalChinese]: 'Chinese, Traditional',
  [LanguageEnum.Vietnamese]: 'Vietnamese',
};

export const enumDisplayLivingSituation: {
  [key in LivingSituationEnum]: string;
} = {
  [LivingSituationEnum.AnotherShelter]: 'Another Shelter',
  [LivingSituationEnum.Housing]: 'Housing',
  [LivingSituationEnum.InformallyHoused]: 'Informally Housed',
  [LivingSituationEnum.JusticeInvolved]: 'Justice Involved',
  [LivingSituationEnum.MedicalFacility]: 'Medical Facility',
  [LivingSituationEnum.OpenAir]: 'Open Air',
  [LivingSituationEnum.Other]: 'Other',
  [LivingSituationEnum.RentalOrOwnedHome]: 'Rental or Owned Home',
  [LivingSituationEnum.Shelter]: 'Shelter',
  [LivingSituationEnum.Tent]: 'Tent',
  [LivingSituationEnum.Unknown]: 'Unknown',
  [LivingSituationEnum.Vehicle]: 'Vehicle',
};

export const enumDisplayHmisAgency: {
  [key in HmisAgencyEnum]: string;
} = {
  [HmisAgencyEnum.Champ]: 'CHAMP',
  [HmisAgencyEnum.Lahsa]: 'LAHSA',
  [HmisAgencyEnum.LongBeach]: 'Long Beach',
  [HmisAgencyEnum.Other]: 'Other',
  [HmisAgencyEnum.Pasadena]: 'Pasadena',
  [HmisAgencyEnum.Vash]: 'VASH',
};

export const enumDisplayGender: { [key in GenderEnum]: string } = {
  [GenderEnum.CisFemale]: 'Cis Female',
  [GenderEnum.CisMale]: 'Cis Male',
  [GenderEnum.NonBinary]: 'Non-Binary',
  [GenderEnum.Other]: 'Other',
  [GenderEnum.PreferNotToSay]: 'Prefer not to say',
  [GenderEnum.TransFemale]: 'Transgender Female',
  [GenderEnum.TransMale]: 'Transgender Male',
};

export const enumDisplayPronoun: { [key in PronounEnum]: string } = {
  [PronounEnum.HeHimHis]: 'He/Him',
  [PronounEnum.SheHerHers]: 'She/Her',
  [PronounEnum.TheyThemTheirs]: 'They/Them',
  [PronounEnum.Other]: 'Other',
};

export const enumDisplayRace: { [key in RaceEnum]: string } = {
  [RaceEnum.AmericanIndianAlaskaNative]: 'American Indian/Alaska Native',
  [RaceEnum.Asian]: 'Asian',
  [RaceEnum.BlackAfricanAmerican]: 'African American',
  [RaceEnum.HispanicLatino]: 'Hispanic/Latino',
  [RaceEnum.NativeHawaiianPacificIslander]: 'Native Hawaiian/Pacific Islander',
  [RaceEnum.Other]: 'Other',
  [RaceEnum.PreferNotToSay]: 'Prefer not to say',
  [RaceEnum.WhiteCaucasian]: 'White/Caucasian',
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

export const enumDisplayDocumentType: {
  [key in ClientDocumentNamespaceEnum]: string;
} = {
  [ClientDocumentNamespaceEnum.BirthCertificate]: 'Birth Certificate',
  [ClientDocumentNamespaceEnum.ClientUpload]: 'Client Upload',
  [ClientDocumentNamespaceEnum.ConsentForm]: 'Consent Form',
  [ClientDocumentNamespaceEnum.DriversLicenseBack]: `Driver's License Back`,
  [ClientDocumentNamespaceEnum.DriversLicenseFront]: `Driver's License Front`,
  [ClientDocumentNamespaceEnum.HmisForm]: 'HMIS Form',
  [ClientDocumentNamespaceEnum.IncomeDocuments]: 'Income Documents',
  [ClientDocumentNamespaceEnum.IncomeForm]: 'Income Form',
  [ClientDocumentNamespaceEnum.OtherClientDocument]: 'Other',
  [ClientDocumentNamespaceEnum.OtherDocReady]: 'Other',
  [ClientDocumentNamespaceEnum.OtherForm]: 'Other Form',
  [ClientDocumentNamespaceEnum.PhotoId]: 'Photo ID',
  [ClientDocumentNamespaceEnum.SocialSecurityCard]: 'Social Security Card',
};

export const enumDisplayVeteranStatus: { [key in VeteranStatusEnum]: string } =
  {
    [VeteranStatusEnum.Yes]: 'Yes',
    [VeteranStatusEnum.No]: 'No',
    [VeteranStatusEnum.PreferNotToSay]: 'Prefer not to say',
    [VeteranStatusEnum.OtherThanHonorable]: 'Other than Honorable Discharge',
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

export const enumDisplaySocialMedia: { [key in SocialMediaEnum]: string } = {
  [SocialMediaEnum.Facebook]: 'Facebook',
  [SocialMediaEnum.Instagram]: 'Instagram',
  [SocialMediaEnum.Linkedin]: 'Linkedin',
  [SocialMediaEnum.Other]: 'Other',
  [SocialMediaEnum.Snapchat]: 'Snapchat',
  [SocialMediaEnum.Tiktok]: 'Tiktok',
  [SocialMediaEnum.Twitter]: 'Twitter',
  [SocialMediaEnum.Whatsapp]: 'Whatsapp',
};

export const enumDisplayPreferredCommunication: {
  [key in PreferredCommunicationEnum]: string;
} = {
  [PreferredCommunicationEnum.Call]: 'Call',
  [PreferredCommunicationEnum.Email]: 'Email',
  [PreferredCommunicationEnum.Facebook]: 'Facebook',
  [PreferredCommunicationEnum.Instagram]: 'Instagram',
  [PreferredCommunicationEnum.Linkedin]: 'Linkedin',
  [PreferredCommunicationEnum.Text]: 'Text',
  [PreferredCommunicationEnum.Whatsapp]: 'Whatsapp',
};

export const enumDisplayServiceType: {
  [key in ServiceRequestTypeEnum]: string;
} = {
  [ServiceRequestTypeEnum.Provided]: 'Provided',
  [ServiceRequestTypeEnum.Requested]: 'Requested',
};

export const enumDisplayAdaAccommodationEnum: {
  [key in AdaAccommodationEnum]: string;
} = {
  [AdaAccommodationEnum.Hearing]: 'Hearing',
  [AdaAccommodationEnum.Mobility]: 'Mobility',
  [AdaAccommodationEnum.Visual]: 'Visual',
  [AdaAccommodationEnum.Other]: 'Other',
};

export const enumDisplaySelahTeam: {
  [key in SelahTeamEnum]: string;
} = {
  [SelahTeamEnum.BowtieRiversideOutreach]: 'Bowtie & Riverside Outreach',
  [SelahTeamEnum.EchoParkOnSite]: 'Echo Park On-site',
  [SelahTeamEnum.EchoParkOutreach]: 'Echo Park Outreach',
  [SelahTeamEnum.HollywoodOnSite]: 'Hollywood On-site',
  [SelahTeamEnum.HollywoodOutreach]: 'Hollywood Outreach',
  [SelahTeamEnum.LaRiverOutreach]: 'LA River Outreach',
  [SelahTeamEnum.LosFelizOutreach]: 'Los Feliz Outreach',
  [SelahTeamEnum.NortheastHollywoodOutreach]: 'Northeast Hollywood Outreach',
  [SelahTeamEnum.SilverLakeOutreach]: 'Silver Lake Outreach',
  [SelahTeamEnum.SlccOnSite]: 'SLCC On-site',
  [SelahTeamEnum.SundaySocialAtwaterOnSite]: 'Sunday Social / Atwater On-site',
  [SelahTeamEnum.SundaySocialAtwaterOutreach]:
    'Sunday Social / Atwater Outreach',
  [SelahTeamEnum.WdiOnSite]: 'WDI On-site',
  [SelahTeamEnum.WdiOutreach]: 'WDI Outreach',
};

export const enumDisplayTaskStatus: {
  [key in TaskStatusEnum]: string;
} = {
  [TaskStatusEnum.ToDo]: 'To Do',
  [TaskStatusEnum.InProgress]: 'In Progress',
  [TaskStatusEnum.Completed]: 'Completed',
};
