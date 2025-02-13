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
  ServiceEnum,
  ServiceRequestTypeEnum,
  SocialMediaEnum,
  VeteranStatusEnum,
  YesNoPreferNotToSayEnum,
} from '../apollo';

export const enumDisplayLanguage: { [key in LanguageEnum]: string } = {
  [LanguageEnum.Arabic]: 'Arabic',
  [LanguageEnum.Armenian]: 'Armenian',
  [LanguageEnum.Asl]: 'American Sign Language',
  [LanguageEnum.SimplifiedChinese]: 'Chinese, Simplified',
  [LanguageEnum.TraditionalChinese]: 'Chinese, Traditional',
  [LanguageEnum.English]: 'English',
  [LanguageEnum.Farsi]: 'Farsi',
  [LanguageEnum.French]: 'French',
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
  [HmisAgencyEnum.LongBeach]: 'Long Beach',
  [HmisAgencyEnum.Pasadena]: 'Pasadena',
  [HmisAgencyEnum.Champ]: 'CHAMP',
  [HmisAgencyEnum.Vash]: 'VASH',
};

export const enumDisplayGender: { [key in GenderEnum]: string } = {
  [GenderEnum.Female]: 'Female',
  [GenderEnum.Male]: 'Male',
  [GenderEnum.NonBinary]: 'Non-Binary',
  [GenderEnum.PreferNotToSay]: 'Prefer not to say',
  [GenderEnum.Other]: 'Other',
  [GenderEnum.TransMale]: 'Transgender Male',
  [GenderEnum.TransFemale]: 'Transgender Female',
};

export const enumDisplayYesNoPreferNot: {
  [key in YesNoPreferNotToSayEnum]: string;
} = {
  [YesNoPreferNotToSayEnum.Yes]: 'Yes',
  [YesNoPreferNotToSayEnum.No]: 'No',
  [YesNoPreferNotToSayEnum.PreferNotToSay]: 'Prefer not to say',
  [YesNoPreferNotToSayEnum.OtherThanHonorable]:
    'Other than Honorable Discharge',
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
    [YesNoPreferNotToSayEnum.OtherThanHonorable]:
      'Other than Honorable Discharge',
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

export const enumDisplayServices: { [key in ServiceEnum]: string } = {
  [ServiceEnum.Bag]: 'Bag(s)',
  [ServiceEnum.Batteries]: 'Batteries',
  [ServiceEnum.Blanket]: 'Blanket',
  [ServiceEnum.Bicycle]: 'Bicycle',
  [ServiceEnum.BicycleRepair]: 'Bicycle Repair',
  [ServiceEnum.BirthCertificate]: 'Birth Certificate',
  [ServiceEnum.Book]: 'Book',
  [ServiceEnum.CaliforniaLifelinePhone]: 'California Lifeline Phone',
  [ServiceEnum.Clothes]: 'Clothes',
  [ServiceEnum.ConsentToConnect]: 'Consent to Connect (CM or Council District)',
  [ServiceEnum.ContactDpss]: 'Contact DPSS',
  [ServiceEnum.ContactFriend]: 'Contact Friend',
  [ServiceEnum.Dental]: 'Dental',
  [ServiceEnum.DiscountScooterRides]: 'Discount Scooter Rides',
  [ServiceEnum.DmhEvaluation]: 'DMH Evaluation',
  [ServiceEnum.DmvNoFeeIdForm]: 'DMV No Fee ID Form',
  [ServiceEnum.Ebt]: 'EBT',
  [ServiceEnum.FamilyReunification]: 'Family Reunification',
  [ServiceEnum.FeminineHygiene]: 'Feminine Hygiene',
  [ServiceEnum.FirstAid]: 'First Aid',
  [ServiceEnum.Food]: 'Food',
  [ServiceEnum.HarmReduction]: 'Harm Reduction',
  [ServiceEnum.HmisConsent]: 'HMIS Consent',
  [ServiceEnum.HygieneKit]: 'Hygiene Kit',
  [ServiceEnum.InternetAccess]: 'Internet Access',
  [ServiceEnum.Lahop]: 'LAHOP',
  [ServiceEnum.LegalCounsel]: 'Legal Counsel',
  [ServiceEnum.MailPickUp]: 'Mail Pick Up',
  [ServiceEnum.Medical]: 'Medical',
  [ServiceEnum.MediCal]: 'Medi-Cal',
  [ServiceEnum.MetroLifeTap]: 'Metro LIFE Tap',
  [ServiceEnum.PetCare]: 'Pet Care',
  [ServiceEnum.PetFood]: 'Pet Food',
  [ServiceEnum.PublicBenefitsPrograms]: 'Public Benefits Programs',
  [ServiceEnum.Ride]: 'Ride',
  [ServiceEnum.SafeParking]: 'Safe Parking',
  [ServiceEnum.Shelter]: 'Shelter',
  [ServiceEnum.Shoes]: 'Shoes',
  [ServiceEnum.SleepingBag]: 'Sleeping Bag',
  [ServiceEnum.SsiSsdi]: 'SSI/SSDI',
  [ServiceEnum.SocialSecurityCardReplacement]:
    'Social Security Card Replacement',
  [ServiceEnum.Shower]: 'Shower',
  [ServiceEnum.Stabilize]: 'Stabilize',
  [ServiceEnum.StimulusAssistance]: 'Stimulus Assistance',
  [ServiceEnum.Storage]: 'Storage',
  [ServiceEnum.StorageBelongings]: 'Storage Belongings',
  [ServiceEnum.StorageDocuments]: 'Storage Documents',
  [ServiceEnum.Tarp]: 'Tarp',
  [ServiceEnum.Tent]: 'Tent',
  [ServiceEnum.TherapistAppointment]: 'Therapist Appointment',
  [ServiceEnum.Transport]: 'Transport',
  [ServiceEnum.UnemploymentCertification]: 'Unemployment Certification',
  [ServiceEnum.VaccinePassport]: 'Vaccine Passport',
  [ServiceEnum.Water]: 'Water',
  [ServiceEnum.Other]: 'Other',
};

export const enumDisplaySocialMedia: { [key in SocialMediaEnum]: string } = {
  [SocialMediaEnum.Facebook]: 'Facebook',
  [SocialMediaEnum.Instagram]: 'Instagram',
  [SocialMediaEnum.Linkedin]: 'Linkedin',
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
