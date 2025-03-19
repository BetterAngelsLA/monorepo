export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date (isoformat) */
  Date: { input: any; output: any; }
  /** Date with time (isoformat) */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: any; output: any; }
  PhoneNumber: { input: any; output: any; }
  /** Represents a point as `(x, y, z)` or `(x, y)`. */
  Point: { input: any; output: any; }
  /** Time (isoformat) */
  Time: { input: any; output: any; }
  UUID: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export enum AccessibilityChoices {
  MedicalEquipmentPermitted = 'MEDICAL_EQUIPMENT_PERMITTED',
  WheelchairAccessible = 'WHEELCHAIR_ACCESSIBLE'
}

export type AccessibilityType = {
  __typename?: 'AccessibilityType';
  name?: Maybe<AccessibilityChoices>;
};

export enum AdaAccommodationEnum {
  Hearing = 'HEARING',
  Mobility = 'MOBILITY',
  Other = 'OTHER',
  Visual = 'VISUAL'
}

export type AddNoteTaskInput = {
  noteId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
  taskType: TaskTypeEnum;
};

export type AddNoteTaskPayload = NoteType | OperationInfo;

export type AddressInput = {
  addressComponents?: InputMaybe<Scalars['JSON']['input']>;
  formattedAddress?: InputMaybe<Scalars['String']['input']>;
};

export type AddressType = {
  __typename?: 'AddressType';
  city?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  state?: Maybe<Scalars['String']['output']>;
  street?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type AttachmentInterface = {
  attachmentType: AttachmentType;
  createdAt: Scalars['DateTime']['output'];
  file: DjangoFileType;
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  originalFilename?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AttachmentType {
  Audio = 'AUDIO',
  Document = 'DOCUMENT',
  Image = 'IMAGE',
  Unknown = 'UNKNOWN',
  Video = 'VIDEO'
}

export type AuthInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  code_verifier?: InputMaybe<Scalars['String']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  redirect_uri?: InputMaybe<Scalars['String']['input']>;
};

export type AuthResponse = {
  __typename?: 'AuthResponse';
  status_code: Scalars['String']['output'];
};

export enum CityChoices {
  AgouraHills = 'AGOURA_HILLS',
  Alhambra = 'ALHAMBRA',
  Arcadia = 'ARCADIA',
  Artesia = 'ARTESIA',
  Avalon = 'AVALON',
  Azusa = 'AZUSA',
  BaldwinPark = 'BALDWIN_PARK',
  Bell = 'BELL',
  Bellflower = 'BELLFLOWER',
  BellGardens = 'BELL_GARDENS',
  BeverlyHills = 'BEVERLY_HILLS',
  Bradbury = 'BRADBURY',
  Burbank = 'BURBANK',
  Calabasas = 'CALABASAS',
  Carson = 'CARSON',
  Cerritos = 'CERRITOS',
  Claremont = 'CLAREMONT',
  Commerce = 'COMMERCE',
  Compton = 'COMPTON',
  Covina = 'COVINA',
  Cudahy = 'CUDAHY',
  CulverCity = 'CULVER_CITY',
  DiamondBar = 'DIAMOND_BAR',
  Downey = 'DOWNEY',
  Duarte = 'DUARTE',
  ElMonte = 'EL_MONTE',
  ElSegundo = 'EL_SEGUNDO',
  Gardena = 'GARDENA',
  Glendale = 'GLENDALE',
  Glendora = 'GLENDORA',
  HawaiianGardens = 'HAWAIIAN_GARDENS',
  Hawthorne = 'HAWTHORNE',
  HermosaBeach = 'HERMOSA_BEACH',
  HiddenHills = 'HIDDEN_HILLS',
  Hollywood = 'HOLLYWOOD',
  HuntingtonPark = 'HUNTINGTON_PARK',
  Industry = 'INDUSTRY',
  Inglewood = 'INGLEWOOD',
  Irwindale = 'IRWINDALE',
  Lakewood = 'LAKEWOOD',
  Lancaster = 'LANCASTER',
  Lawndale = 'LAWNDALE',
  LaCanadaFlintridge = 'LA_CANADA_FLINTRIDGE',
  LaHabraHeights = 'LA_HABRA_HEIGHTS',
  LaMirada = 'LA_MIRADA',
  LaPuente = 'LA_PUENTE',
  LaVerne = 'LA_VERNE',
  Lomita = 'LOMITA',
  LongBeach = 'LONG_BEACH',
  LosAngeles = 'LOS_ANGELES',
  Lynwood = 'LYNWOOD',
  Malibu = 'MALIBU',
  ManhattanBeach = 'MANHATTAN_BEACH',
  Maywood = 'MAYWOOD',
  Monrovia = 'MONROVIA',
  Montebello = 'MONTEBELLO',
  MontereyPark = 'MONTEREY_PARK',
  Norwalk = 'NORWALK',
  Palmdale = 'PALMDALE',
  PalosVerdesEstates = 'PALOS_VERDES_ESTATES',
  Paramount = 'PARAMOUNT',
  Pasadena = 'PASADENA',
  PicoRivera = 'PICO_RIVERA',
  Pomona = 'POMONA',
  RanchoPalosVerdes = 'RANCHO_PALOS_VERDES',
  RedondoBeach = 'REDONDO_BEACH',
  RollingHills = 'ROLLING_HILLS',
  RollingHillsEstates = 'ROLLING_HILLS_ESTATES',
  Rosemead = 'ROSEMEAD',
  SantaClarita = 'SANTA_CLARITA',
  SantaFeSprings = 'SANTA_FE_SPRINGS',
  SantaMonica = 'SANTA_MONICA',
  SanDimas = 'SAN_DIMAS',
  SanFernando = 'SAN_FERNANDO',
  SanGabriel = 'SAN_GABRIEL',
  SanMarino = 'SAN_MARINO',
  SierraMadre = 'SIERRA_MADRE',
  SignalHill = 'SIGNAL_HILL',
  SouthElMonte = 'SOUTH_EL_MONTE',
  SouthGate = 'SOUTH_GATE',
  SouthPasadena = 'SOUTH_PASADENA',
  TempleCity = 'TEMPLE_CITY',
  Torrance = 'TORRANCE',
  Venice = 'VENICE',
  Vernon = 'VERNON',
  Walnut = 'WALNUT',
  WestlakeVillage = 'WESTLAKE_VILLAGE',
  WestCovina = 'WEST_COVINA',
  WestHollywood = 'WEST_HOLLYWOOD',
  WestLosAngeles = 'WEST_LOS_ANGELES',
  Whittier = 'WHITTIER'
}

export type CityType = {
  __typename?: 'CityType';
  name?: Maybe<CityChoices>;
};

export type ClientContactInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['PhoneNumber']['input']>;
  relationshipToClient?: InputMaybe<RelationshipTypeEnum>;
  relationshipToClientOther?: InputMaybe<Scalars['String']['input']>;
};

export type ClientContactType = {
  __typename?: 'ClientContactType';
  clientProfile: DjangoModelType;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mailingAddress?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['PhoneNumber']['output']>;
  relationshipToClient?: Maybe<RelationshipTypeEnum>;
  relationshipToClientOther?: Maybe<Scalars['String']['output']>;
};

export enum ClientDocumentNamespaceEnum {
  BirthCertificate = 'BIRTH_CERTIFICATE',
  ConsentForm = 'CONSENT_FORM',
  DriversLicenseBack = 'DRIVERS_LICENSE_BACK',
  DriversLicenseFront = 'DRIVERS_LICENSE_FRONT',
  HmisForm = 'HMIS_FORM',
  IncomeForm = 'INCOME_FORM',
  OtherClientDocument = 'OTHER_CLIENT_DOCUMENT',
  OtherDocReady = 'OTHER_DOC_READY',
  OtherForm = 'OTHER_FORM',
  PhotoId = 'PHOTO_ID',
  SocialSecurityCard = 'SOCIAL_SECURITY_CARD'
}

export type ClientDocumentType = AttachmentInterface & {
  __typename?: 'ClientDocumentType';
  attachmentType: AttachmentType;
  createdAt: Scalars['DateTime']['output'];
  file: DjangoFileType;
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  namespace: ClientDocumentNamespaceEnum;
  originalFilename?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ClientDocumentTypeOffsetPaginated = {
  __typename?: 'ClientDocumentTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ClientDocumentType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type ClientHouseholdMemberInput = {
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  gender?: InputMaybe<GenderEnum>;
  genderOther?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  relationshipToClient?: InputMaybe<RelationshipTypeEnum>;
  relationshipToClientOther?: InputMaybe<Scalars['String']['input']>;
};

export type ClientHouseholdMemberType = {
  __typename?: 'ClientHouseholdMemberType';
  clientProfile: DjangoModelType;
  dateOfBirth?: Maybe<Scalars['Date']['output']>;
  displayGender?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<GenderEnum>;
  genderOther?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  relationshipToClient?: Maybe<RelationshipTypeEnum>;
  relationshipToClientOther?: Maybe<Scalars['String']['output']>;
};

export type ClientProfileDataImportType = {
  __typename?: 'ClientProfileDataImportType';
  id: Scalars['UUID']['output'];
  importedAt: Scalars['DateTime']['output'];
  importedBy: DjangoModelType;
  notes: Scalars['String']['output'];
  sourceFile: Scalars['String']['output'];
};

export type ClientProfileFilter = {
  AND?: InputMaybe<ClientProfileFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ClientProfileFilter>;
  OR?: InputMaybe<ClientProfileFilter>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  searchClient?: InputMaybe<ClientSearchInput>;
};

export type ClientProfileImportRecordType = {
  __typename?: 'ClientProfileImportRecordType';
  clientProfile?: Maybe<ClientProfileType>;
  createdAt: Scalars['DateTime']['output'];
  errorMessage: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  rawData: Scalars['JSON']['output'];
  sourceId: Scalars['String']['output'];
  sourceName: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientProfileImportRecordTypeOffsetPaginated = {
  __typename?: 'ClientProfileImportRecordTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ClientProfileImportRecordType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type ClientProfileImportRecordsBulkInput = {
  source: Scalars['String']['input'];
  sourceIds: Array<Scalars['String']['input']>;
};

export type ClientProfileOrder = {
  id?: InputMaybe<Ordering>;
  user_FirstName?: InputMaybe<Ordering>;
  user_LastName?: InputMaybe<Ordering>;
};

export type ClientProfilePhotoInput = {
  clientProfile: Scalars['ID']['input'];
  photo: Scalars['Upload']['input'];
};

export type ClientProfileType = {
  __typename?: 'ClientProfileType';
  adaAccommodation?: Maybe<Array<AdaAccommodationEnum>>;
  address?: Maybe<Scalars['String']['output']>;
  age?: Maybe<Scalars['Int']['output']>;
  californiaId?: Maybe<Scalars['String']['output']>;
  consentFormDocuments?: Maybe<Array<ClientDocumentType>>;
  contacts?: Maybe<Array<ClientContactType>>;
  dateOfBirth?: Maybe<Scalars['Date']['output']>;
  displayCaseManager: Scalars['String']['output'];
  displayGender?: Maybe<Scalars['String']['output']>;
  displayPronouns?: Maybe<Scalars['String']['output']>;
  docReadyDocuments?: Maybe<Array<ClientDocumentType>>;
  eyeColor?: Maybe<EyeColorEnum>;
  gender?: Maybe<GenderEnum>;
  genderOther?: Maybe<Scalars['String']['output']>;
  hairColor?: Maybe<HairColorEnum>;
  heightInInches?: Maybe<Scalars['Float']['output']>;
  hmisProfiles?: Maybe<Array<HmisProfileType>>;
  householdMembers?: Maybe<Array<ClientHouseholdMemberType>>;
  id: Scalars['ID']['output'];
  importantNotes?: Maybe<Scalars['String']['output']>;
  livingSituation?: Maybe<LivingSituationEnum>;
  mailingAddress?: Maybe<Scalars['String']['output']>;
  maritalStatus?: Maybe<MaritalStatusEnum>;
  nickname?: Maybe<Scalars['String']['output']>;
  otherDocuments?: Maybe<Array<ClientDocumentType>>;
  phoneNumber?: Maybe<Scalars['PhoneNumber']['output']>;
  phoneNumbers?: Maybe<Array<PhoneNumberType>>;
  physicalDescription?: Maybe<Scalars['String']['output']>;
  placeOfBirth?: Maybe<Scalars['String']['output']>;
  preferredCommunication?: Maybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: Maybe<LanguageEnum>;
  profilePhoto?: Maybe<DjangoImageType>;
  pronouns?: Maybe<PronounEnum>;
  pronounsOther?: Maybe<Scalars['String']['output']>;
  race?: Maybe<RaceEnum>;
  residenceAddress?: Maybe<Scalars['String']['output']>;
  socialMediaProfiles?: Maybe<Array<SocialMediaProfileType>>;
  spokenLanguages?: Maybe<Array<LanguageEnum>>;
  user: UserType;
  veteranStatus?: Maybe<VeteranStatusEnum>;
};


export type ClientProfileTypeConsentFormDocumentsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type ClientProfileTypeDocReadyDocumentsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type ClientProfileTypeOtherDocumentsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type ClientProfileTypeOffsetPaginated = {
  __typename?: 'ClientProfileTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ClientProfileType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type ClientSearchInput = {
  californiaId?: InputMaybe<Scalars['String']['input']>;
  excludedClientProfileId?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type ContactInfoType = {
  __typename?: 'ContactInfoType';
  contactName: Scalars['String']['output'];
  contactNumber: Scalars['PhoneNumber']['output'];
  id: Scalars['ID']['output'];
};

export type CreateClientDocumentInput = {
  clientProfile: Scalars['ID']['input'];
  file: Scalars['Upload']['input'];
  namespace: ClientDocumentNamespaceEnum;
};

export type CreateClientDocumentPayload = ClientDocumentType | OperationInfo;

export type CreateClientProfileDataImportPayload = ClientProfileDataImportType | OperationInfo;

export type CreateClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<ClientContactInput>>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  gender?: InputMaybe<GenderEnum>;
  genderOther?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  hmisProfiles?: InputMaybe<Array<HmisProfileInput>>;
  householdMembers?: InputMaybe<Array<ClientHouseholdMemberInput>>;
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['PhoneNumber']['input']>;
  phoneNumbers?: InputMaybe<Array<PhoneNumberInput>>;
  physicalDescription?: InputMaybe<Scalars['String']['input']>;
  placeOfBirth?: InputMaybe<Scalars['String']['input']>;
  preferredCommunication?: InputMaybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  profilePhoto?: InputMaybe<Scalars['Upload']['input']>;
  pronouns?: InputMaybe<PronounEnum>;
  pronounsOther?: InputMaybe<Scalars['String']['input']>;
  race?: InputMaybe<RaceEnum>;
  residenceAddress?: InputMaybe<Scalars['String']['input']>;
  socialMediaProfiles?: InputMaybe<Array<SocialMediaProfileInput>>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  user: CreateUserInput;
  veteranStatus?: InputMaybe<VeteranStatusEnum>;
};

export type CreateClientProfilePayload = ClientProfileType | OperationInfo;

export type CreateNoteDataImportInput = {
  notes: Scalars['String']['input'];
  sourceFile: Scalars['String']['input'];
};

export type CreateNoteDataImportPayload = NoteDataImportType | OperationInfo;

export type CreateNoteInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  interactedAt?: InputMaybe<Scalars['DateTime']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  team?: InputMaybe<SelahTeamEnum>;
};

export type CreateNoteMoodInput = {
  descriptor: MoodEnum;
  noteId: Scalars['ID']['input'];
};

export type CreateNoteMoodPayload = MoodType | OperationInfo;

export type CreateNotePayload = NoteType | OperationInfo;

export type CreateNoteServiceRequestInput = {
  noteId: Scalars['ID']['input'];
  service: ServiceEnum;
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  serviceRequestType: ServiceRequestTypeEnum;
};

export type CreateNoteServiceRequestPayload = OperationInfo | ServiceRequestType;

export type CreateNoteTaskInput = {
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  noteId: Scalars['ID']['input'];
  status: TaskStatusEnum;
  taskType: TaskTypeEnum;
  title: Scalars['String']['input'];
};

export type CreateNoteTaskPayload = OperationInfo | TaskType;

export type CreateProfileDataImportInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  sourceFile: Scalars['String']['input'];
};

export type CreateServiceRequestInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  service: ServiceEnum;
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  status: ServiceRequestStatusEnum;
};

export type CreateServiceRequestPayload = OperationInfo | ServiceRequestType;

export type CreateTaskInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  status: TaskStatusEnum;
  title: Scalars['String']['input'];
};

export type CreateTaskPayload = OperationInfo | TaskType;

export type CreateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteClientDocumentPayload = ClientDocumentType | OperationInfo;

export type DeleteClientProfilePayload = DeletedObjectType | OperationInfo;

export type DeleteCurrentUserPayload = DeletedObjectType | OperationInfo;

export type DeleteDjangoObjectInput = {
  id: Scalars['ID']['input'];
};

export type DeleteMoodPayload = DeletedObjectType | OperationInfo;

export type DeleteNotePayload = NoteType | OperationInfo;

export type DeleteServiceRequestPayload = DeletedObjectType | OperationInfo;

export type DeleteTaskPayload = DeletedObjectType | OperationInfo;

export type DeletedObjectType = {
  __typename?: 'DeletedObjectType';
  id: Scalars['Int']['output'];
};

export enum DemographicChoices {
  All = 'ALL',
  Families = 'FAMILIES',
  Other = 'OTHER',
  Seniors = 'SENIORS',
  SingleMen = 'SINGLE_MEN',
  SingleMoms = 'SINGLE_MOMS',
  SingleWomen = 'SINGLE_WOMEN',
  TayTeen = 'TAY_TEEN'
}

export type DemographicType = {
  __typename?: 'DemographicType';
  name?: Maybe<DemographicChoices>;
};

export type DjangoFileType = {
  __typename?: 'DjangoFileType';
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type DjangoImageType = {
  __typename?: 'DjangoImageType';
  height: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export type DjangoModelType = {
  __typename?: 'DjangoModelType';
  pk: Scalars['ID']['output'];
};

export enum DueByGroupEnum {
  FutureTasks = 'FUTURE_TASKS',
  InTheNextWeek = 'IN_THE_NEXT_WEEK',
  NoDueDate = 'NO_DUE_DATE',
  Overdue = 'OVERDUE',
  Today = 'TODAY',
  Tomorrow = 'TOMORROW'
}

export enum EntryRequirementChoices {
  MedicaidOrMedicare = 'MEDICAID_OR_MEDICARE',
  PhotoId = 'PHOTO_ID',
  Referral = 'REFERRAL',
  Reservation = 'RESERVATION'
}

export type EntryRequirementType = {
  __typename?: 'EntryRequirementType';
  name?: Maybe<EntryRequirementChoices>;
};

export enum EyeColorEnum {
  Blue = 'BLUE',
  Brown = 'BROWN',
  Gray = 'GRAY',
  Green = 'GREEN',
  Hazel = 'HAZEL',
  Other = 'OTHER'
}

export type FeatureControlData = {
  __typename?: 'FeatureControlData';
  flags: Array<FlagType>;
  samples: Array<SampleType>;
  switches: Array<SwitchType>;
};

export type FlagType = {
  __typename?: 'FlagType';
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastModified?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
};

export enum FunderChoices {
  CityOfLosAngeles = 'CITY_OF_LOS_ANGELES',
  Dhs = 'DHS',
  Dmh = 'DMH',
  FederalFunding = 'FEDERAL_FUNDING',
  Hopwa = 'HOPWA',
  Lahsa = 'LAHSA',
  Other = 'OTHER',
  Private = 'PRIVATE'
}

export type FunderType = {
  __typename?: 'FunderType';
  name?: Maybe<FunderChoices>;
};

export enum GenderEnum {
  Female = 'FEMALE',
  Male = 'MALE',
  NonBinary = 'NON_BINARY',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
  TransFemale = 'TRANS_FEMALE',
  TransMale = 'TRANS_MALE'
}

export enum GeneralServiceChoices {
  CaseManagement = 'CASE_MANAGEMENT',
  Childcare = 'CHILDCARE',
  ComputerAccess = 'COMPUTER_ACCESS',
  EmploymentServices = 'EMPLOYMENT_SERVICES',
  FinancialLiteracyAssistance = 'FINANCIAL_LITERACY_ASSISTANCE',
  HousingNavigation = 'HOUSING_NAVIGATION',
  LegalAssistance = 'LEGAL_ASSISTANCE',
  Mail = 'MAIL',
  Phone = 'PHONE',
  Transportation = 'TRANSPORTATION'
}

export type GeneralServiceType = {
  __typename?: 'GeneralServiceType';
  name?: Maybe<GeneralServiceChoices>;
};

export type GeolocationInput = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  rangeInMiles?: InputMaybe<Scalars['Int']['input']>;
};

export enum HairColorEnum {
  Bald = 'BALD',
  Black = 'BLACK',
  Blonde = 'BLONDE',
  Brown = 'BROWN',
  Gray = 'GRAY',
  Other = 'OTHER',
  Red = 'RED',
  White = 'WHITE'
}

export enum HealthServiceChoices {
  Dental = 'DENTAL',
  Medical = 'MEDICAL',
  MentalHealth = 'MENTAL_HEALTH',
  SubstanceUseTreatment = 'SUBSTANCE_USE_TREATMENT'
}

export type HealthServiceType = {
  __typename?: 'HealthServiceType';
  name?: Maybe<HealthServiceChoices>;
};

export enum HmisAgencyEnum {
  Champ = 'CHAMP',
  Lahsa = 'LAHSA',
  LongBeach = 'LONG_BEACH',
  Pasadena = 'PASADENA',
  Vash = 'VASH'
}

export type HmisProfileInput = {
  agency: HmisAgencyEnum;
  hmisId: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type HmisProfileType = {
  __typename?: 'HmisProfileType';
  agency: HmisAgencyEnum;
  hmisId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export enum ImmediateNeedChoices {
  Clothing = 'CLOTHING',
  Food = 'FOOD',
  Showers = 'SHOWERS'
}

export type ImmediateNeedType = {
  __typename?: 'ImmediateNeedType';
  name?: Maybe<ImmediateNeedChoices>;
};

export type ImportClientProfileInput = {
  clientProfile: CreateClientProfileInput;
  importJobId: Scalars['UUID']['input'];
  rawData: Scalars['JSON']['input'];
  sourceId: Scalars['String']['input'];
  sourceName: Scalars['String']['input'];
};

export type ImportClientProfilePayload = ClientProfileImportRecordType | OperationInfo;

export type ImportNoteInput = {
  importJobId: Scalars['UUID']['input'];
  note: CreateNoteInput;
  rawData: Scalars['JSON']['input'];
  sourceId: Scalars['String']['input'];
  sourceName: Scalars['String']['input'];
};

export type ImportNotePayload = NoteImportRecordType | OperationInfo;

export type InteractionAuthorFilter = {
  AND?: InputMaybe<InteractionAuthorFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<InteractionAuthorFilter>;
  OR?: InputMaybe<InteractionAuthorFilter>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type InteractionAuthorOrder = {
  firstName?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  lastName?: InputMaybe<Ordering>;
};

export type InteractionAuthorType = {
  __typename?: 'InteractionAuthorType';
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  middleName?: Maybe<Scalars['String']['output']>;
};

export type InteractionAuthorTypeOffsetPaginated = {
  __typename?: 'InteractionAuthorTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<InteractionAuthorType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export enum LanguageEnum {
  Arabic = 'ARABIC',
  Armenian = 'ARMENIAN',
  Asl = 'ASL',
  English = 'ENGLISH',
  Farsi = 'FARSI',
  French = 'FRENCH',
  Indonesian = 'INDONESIAN',
  Japanese = 'JAPANESE',
  Khmer = 'KHMER',
  Korean = 'KOREAN',
  Russian = 'RUSSIAN',
  SimplifiedChinese = 'SIMPLIFIED_CHINESE',
  Spanish = 'SPANISH',
  Tagalog = 'TAGALOG',
  TraditionalChinese = 'TRADITIONAL_CHINESE',
  Vietnamese = 'VIETNAMESE'
}

export enum LivingSituationEnum {
  Housing = 'HOUSING',
  OpenAir = 'OPEN_AIR',
  Other = 'OTHER',
  Shelter = 'SHELTER',
  Tent = 'TENT',
  Vehicle = 'VEHICLE'
}

export type LocationInput = {
  address?: InputMaybe<AddressInput>;
  point: Scalars['Point']['input'];
  pointOfInterest?: InputMaybe<Scalars['String']['input']>;
};

export type LocationType = {
  __typename?: 'LocationType';
  address: AddressType;
  id: Scalars['ID']['output'];
  point: Scalars['Point']['output'];
  pointOfInterest?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MagicLinkInput = {
  email: Scalars['String']['input'];
};

export type MagicLinkResponse = {
  __typename?: 'MagicLinkResponse';
  message: Scalars['String']['output'];
};

export enum MaritalStatusEnum {
  Divorced = 'DIVORCED',
  Married = 'MARRIED',
  Separated = 'SEPARATED',
  Single = 'SINGLE',
  Widowed = 'WIDOWED'
}

export enum MoodEnum {
  Agitated = 'AGITATED',
  Agreeable = 'AGREEABLE',
  Anxious = 'ANXIOUS',
  Depressed = 'DEPRESSED',
  Detached = 'DETACHED',
  DisorganizedThought = 'DISORGANIZED_THOUGHT',
  Disoriented = 'DISORIENTED',
  Escalated = 'ESCALATED',
  Euthymic = 'EUTHYMIC',
  FlatBlunted = 'FLAT_BLUNTED',
  Happy = 'HAPPY',
  Hopeless = 'HOPELESS',
  Indifferent = 'INDIFFERENT',
  Manic = 'MANIC',
  Motivated = 'MOTIVATED',
  Optimistic = 'OPTIMISTIC',
  Personable = 'PERSONABLE',
  Pleasant = 'PLEASANT',
  Restless = 'RESTLESS',
  Suicidal = 'SUICIDAL'
}

export type MoodType = {
  __typename?: 'MoodType';
  descriptor: MoodEnum;
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addNoteTask: AddNoteTaskPayload;
  appleAuth: AuthResponse;
  createClientDocument: CreateClientDocumentPayload;
  createClientProfile: CreateClientProfilePayload;
  createClientProfileDataImport: CreateClientProfileDataImportPayload;
  createNote: CreateNotePayload;
  createNoteDataImport: CreateNoteDataImportPayload;
  createNoteMood: CreateNoteMoodPayload;
  createNoteServiceRequest: CreateNoteServiceRequestPayload;
  createNoteTask: CreateNoteTaskPayload;
  createServiceRequest: CreateServiceRequestPayload;
  createTask: CreateTaskPayload;
  deleteClientDocument: DeleteClientDocumentPayload;
  deleteClientProfile: DeleteClientProfilePayload;
  deleteCurrentUser: DeleteCurrentUserPayload;
  deleteMood: DeleteMoodPayload;
  deleteNote: DeleteNotePayload;
  deleteServiceRequest: DeleteServiceRequestPayload;
  deleteTask: DeleteTaskPayload;
  generateMagicLink: MagicLinkResponse;
  googleAuth: AuthResponse;
  importClientProfile: ImportClientProfilePayload;
  importNote: ImportNotePayload;
  login: AuthResponse;
  logout: Scalars['Boolean']['output'];
  removeNoteServiceRequest: RemoveNoteServiceRequestPayload;
  removeNoteTask: RemoveNoteTaskPayload;
  revertNote: RevertNotePayload;
  updateClientProfile: UpdateClientProfilePayload;
  updateClientProfilePhoto: UpdateClientProfilePhotoPayload;
  updateCurrentUser: UpdateCurrentUserPayload;
  updateNote: UpdateNotePayload;
  updateNoteLocation: UpdateNoteLocationPayload;
  updateServiceRequest: UpdateServiceRequestPayload;
  updateTask: UpdateTaskPayload;
  updateTaskLocation: UpdateTaskLocationPayload;
};


export type MutationAddNoteTaskArgs = {
  data: AddNoteTaskInput;
};


export type MutationAppleAuthArgs = {
  input: AuthInput;
};


export type MutationCreateClientDocumentArgs = {
  data: CreateClientDocumentInput;
};


export type MutationCreateClientProfileArgs = {
  data: CreateClientProfileInput;
};


export type MutationCreateClientProfileDataImportArgs = {
  data: CreateProfileDataImportInput;
};


export type MutationCreateNoteArgs = {
  data: CreateNoteInput;
};


export type MutationCreateNoteDataImportArgs = {
  data: CreateNoteDataImportInput;
};


export type MutationCreateNoteMoodArgs = {
  data: CreateNoteMoodInput;
};


export type MutationCreateNoteServiceRequestArgs = {
  data: CreateNoteServiceRequestInput;
};


export type MutationCreateNoteTaskArgs = {
  data: CreateNoteTaskInput;
};


export type MutationCreateServiceRequestArgs = {
  data: CreateServiceRequestInput;
};


export type MutationCreateTaskArgs = {
  data: CreateTaskInput;
};


export type MutationDeleteClientDocumentArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteClientProfileArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteMoodArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteNoteArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteServiceRequestArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteTaskArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationGenerateMagicLinkArgs = {
  data: MagicLinkInput;
};


export type MutationGoogleAuthArgs = {
  input: AuthInput;
};


export type MutationImportClientProfileArgs = {
  data: ImportClientProfileInput;
};


export type MutationImportNoteArgs = {
  data: ImportNoteInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRemoveNoteServiceRequestArgs = {
  data: RemoveNoteServiceRequestInput;
};


export type MutationRemoveNoteTaskArgs = {
  data: RemoveNoteTaskInput;
};


export type MutationRevertNoteArgs = {
  data: RevertNoteInput;
};


export type MutationUpdateClientProfileArgs = {
  data: UpdateClientProfileInput;
};


export type MutationUpdateClientProfilePhotoArgs = {
  data: ClientProfilePhotoInput;
};


export type MutationUpdateCurrentUserArgs = {
  data: UpdateUserInput;
};


export type MutationUpdateNoteArgs = {
  data: UpdateNoteInput;
};


export type MutationUpdateNoteLocationArgs = {
  data: UpdateNoteLocationInput;
};


export type MutationUpdateServiceRequestArgs = {
  data: UpdateServiceRequestInput;
};


export type MutationUpdateTaskArgs = {
  data: UpdateTaskInput;
};


export type MutationUpdateTaskLocationArgs = {
  data: UpdateTaskLocationInput;
};

export type NoteDataImportType = {
  __typename?: 'NoteDataImportType';
  id: Scalars['UUID']['output'];
  importedAt: Scalars['DateTime']['output'];
  importedBy: DjangoModelType;
  notes: Scalars['String']['output'];
  sourceFile: Scalars['String']['output'];
};

export type NoteFilter = {
  AND?: InputMaybe<NoteFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<NoteFilter>;
  OR?: InputMaybe<NoteFilter>;
  authors?: InputMaybe<Array<Scalars['ID']['input']>>;
  client?: InputMaybe<Scalars['ID']['input']>;
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  organization?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  teams?: InputMaybe<Array<SelahTeamEnum>>;
};

export type NoteImportRecordType = {
  __typename?: 'NoteImportRecordType';
  createdAt: Scalars['DateTime']['output'];
  errorMessage: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  note?: Maybe<NoteType>;
  rawData: Scalars['JSON']['output'];
  sourceId: Scalars['String']['output'];
  sourceName: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type NoteOrder = {
  id?: InputMaybe<Ordering>;
  interactedAt?: InputMaybe<Ordering>;
};

export type NoteType = {
  __typename?: 'NoteType';
  client?: Maybe<UserType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  id: Scalars['ID']['output'];
  interactedAt: Scalars['DateTime']['output'];
  isSubmitted: Scalars['Boolean']['output'];
  location?: Maybe<LocationType>;
  moods: Array<MoodType>;
  nextSteps: Array<TaskType>;
  privateDetails?: Maybe<Scalars['String']['output']>;
  providedServices: Array<ServiceRequestType>;
  publicDetails: Scalars['String']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  purposes: Array<TaskType>;
  requestedServices: Array<ServiceRequestType>;
  team?: Maybe<SelahTeamEnum>;
};


export type NoteTypeNextStepsArgs = {
  order?: InputMaybe<TaskOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypeProvidedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypePurposesArgs = {
  order?: InputMaybe<TaskOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypeRequestedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type NoteTypeOffsetPaginated = {
  __typename?: 'NoteTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<NoteType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type OffsetPaginationInfo = {
  __typename?: 'OffsetPaginationInfo';
  limit?: Maybe<Scalars['Int']['output']>;
  offset: Scalars['Int']['output'];
};

export type OffsetPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: Scalars['Int']['input'];
};

export type OneToManyInput = {
  set?: InputMaybe<Scalars['ID']['input']>;
};

export type OperationInfo = {
  __typename?: 'OperationInfo';
  /** List of messages returned by the operation. */
  messages: Array<OperationMessage>;
};

export type OperationMessage = {
  __typename?: 'OperationMessage';
  /** The error code, or `null` if no error code was set. */
  code?: Maybe<Scalars['String']['output']>;
  /** The field that caused the error, or `null` if it isn't associated with any particular field. */
  field?: Maybe<Scalars['String']['output']>;
  /** The kind of this message. */
  kind: OperationMessageKind;
  /** The error message. */
  message: Scalars['String']['output'];
};

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

export enum Ordering {
  Asc = 'ASC',
  AscNullsFirst = 'ASC_NULLS_FIRST',
  AscNullsLast = 'ASC_NULLS_LAST',
  Desc = 'DESC',
  DescNullsFirst = 'DESC_NULLS_FIRST',
  DescNullsLast = 'DESC_NULLS_LAST'
}

export type OrganizationType = {
  __typename?: 'OrganizationType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum ParkingChoices {
  Automobile = 'AUTOMOBILE',
  Bicycle = 'BICYCLE',
  Motorcycle = 'MOTORCYCLE',
  NoParking = 'NO_PARKING',
  Rv = 'RV'
}

export type ParkingType = {
  __typename?: 'ParkingType';
  name?: Maybe<ParkingChoices>;
};

/** Permission definition for schema directives. */
export type PermDefinition = {
  /** The app to which we are requiring permission. If this is empty that means that we are checking the permission directly. */
  app?: InputMaybe<Scalars['String']['input']>;
  /** The permission itself. If this is empty that means that we are checking for any permission for the given app. */
  permission?: InputMaybe<Scalars['String']['input']>;
};

export enum PetChoices {
  Cats = 'CATS',
  DogsOver_25Lbs = 'DOGS_OVER_25_LBS',
  DogsUnder_25Lbs = 'DOGS_UNDER_25_LBS',
  Exotics = 'EXOTICS',
  NoPetsAllowed = 'NO_PETS_ALLOWED',
  ServiceAnimals = 'SERVICE_ANIMALS'
}

export type PetType = {
  __typename?: 'PetType';
  name?: Maybe<PetChoices>;
};

export type PhoneNumberInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  number?: InputMaybe<Scalars['PhoneNumber']['input']>;
};

export type PhoneNumberType = {
  __typename?: 'PhoneNumberType';
  id: Scalars['ID']['output'];
  isPrimary?: Maybe<Scalars['Boolean']['output']>;
  number?: Maybe<Scalars['PhoneNumber']['output']>;
};

export enum PreferredCommunicationEnum {
  Call = 'CALL',
  Email = 'EMAIL',
  Facebook = 'FACEBOOK',
  Instagram = 'INSTAGRAM',
  Linkedin = 'LINKEDIN',
  Text = 'TEXT',
  Whatsapp = 'WHATSAPP'
}

export enum PronounEnum {
  HeHimHis = 'HE_HIM_HIS',
  Other = 'OTHER',
  SheHerHers = 'SHE_HER_HERS',
  TheyThemTheirs = 'THEY_THEM_THEIRS'
}

export type Query = {
  __typename?: 'Query';
  availableOrganizations: Array<OrganizationType>;
  bulkClientProfileImportRecords: ClientProfileImportRecordTypeOffsetPaginated;
  clientDocument: ClientDocumentType;
  clientDocuments: ClientDocumentTypeOffsetPaginated;
  clientDocumentsPaginated: ClientDocumentTypeOffsetPaginated;
  clientProfile: ClientProfileType;
  clientProfiles: ClientProfileTypeOffsetPaginated;
  clientProfilesPaginated: ClientProfileTypeOffsetPaginated;
  currentUser: UserType;
  featureControls: FeatureControlData;
  interactionAuthors: InteractionAuthorTypeOffsetPaginated;
  note: NoteType;
  notes: NoteTypeOffsetPaginated;
  notesPaginated: NoteTypeOffsetPaginated;
  serviceRequest: ServiceRequestType;
  serviceRequests: Array<ServiceRequestType>;
  shelter: ShelterType;
  shelters: ShelterTypeOffsetPaginated;
  task: TaskType;
  tasks: Array<TaskType>;
};


export type QueryBulkClientProfileImportRecordsArgs = {
  data: ClientProfileImportRecordsBulkInput;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientDocumentArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientDocumentsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientDocumentsPaginatedArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientProfileArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientProfilesArgs = {
  filters?: InputMaybe<ClientProfileFilter>;
  order?: InputMaybe<ClientProfileOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientProfilesPaginatedArgs = {
  filters?: InputMaybe<ClientProfileFilter>;
  order?: InputMaybe<ClientProfileOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryInteractionAuthorsArgs = {
  filters?: InputMaybe<InteractionAuthorFilter>;
  order?: InputMaybe<InteractionAuthorOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryNoteArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryNotesArgs = {
  filters?: InputMaybe<NoteFilter>;
  order?: InputMaybe<NoteOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryNotesPaginatedArgs = {
  filters?: InputMaybe<NoteFilter>;
  order?: InputMaybe<NoteOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryServiceRequestArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryServiceRequestsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryShelterArgs = {
  pk: Scalars['ID']['input'];
};


export type QuerySheltersArgs = {
  filters?: InputMaybe<ShelterFilter>;
  order?: InputMaybe<ShelterOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryTaskArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  order?: InputMaybe<TaskOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export enum RaceEnum {
  AmericanIndianAlaskaNative = 'AMERICAN_INDIAN_ALASKA_NATIVE',
  Asian = 'ASIAN',
  BlackAfricanAmerican = 'BLACK_AFRICAN_AMERICAN',
  HispanicLatino = 'HISPANIC_LATINO',
  NativeHawaiianPacificIslander = 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER',
  Other = 'OTHER',
  WhiteCaucasian = 'WHITE_CAUCASIAN'
}

export enum RelationshipTypeEnum {
  Aunt = 'AUNT',
  Child = 'CHILD',
  Cousin = 'COUSIN',
  CurrentCaseManager = 'CURRENT_CASE_MANAGER',
  Father = 'FATHER',
  Friend = 'FRIEND',
  Grandparent = 'GRANDPARENT',
  Mother = 'MOTHER',
  Organization = 'ORGANIZATION',
  Other = 'OTHER',
  PastCaseManager = 'PAST_CASE_MANAGER',
  Pet = 'PET',
  Sibling = 'SIBLING',
  Uncle = 'UNCLE'
}

export type RemoveNoteServiceRequestInput = {
  noteId: Scalars['ID']['input'];
  serviceRequestId: Scalars['ID']['input'];
  serviceRequestType: ServiceRequestTypeEnum;
};

export type RemoveNoteServiceRequestPayload = NoteType | OperationInfo;

export type RemoveNoteTaskInput = {
  noteId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
  taskType: TaskTypeEnum;
};

export type RemoveNoteTaskPayload = NoteType | OperationInfo;

export type RevertNoteInput = {
  id: Scalars['ID']['input'];
  revertBeforeTimestamp: Scalars['DateTime']['input'];
};

export type RevertNotePayload = NoteType | OperationInfo;

export enum RoomStyleChoices {
  Congregant = 'CONGREGANT',
  CubicleHighWalls = 'CUBICLE_HIGH_WALLS',
  CubicleLowWalls = 'CUBICLE_LOW_WALLS',
  MotelRoom = 'MOTEL_ROOM',
  Other = 'OTHER',
  SharedRooms = 'SHARED_ROOMS',
  SingleRoom = 'SINGLE_ROOM'
}

export type RoomStyleType = {
  __typename?: 'RoomStyleType';
  name?: Maybe<RoomStyleChoices>;
};

export enum SpaChoices {
  Eight = 'EIGHT',
  Five = 'FIVE',
  Four = 'FOUR',
  One = 'ONE',
  Seven = 'SEVEN',
  Six = 'SIX',
  Three = 'THREE',
  Two = 'TWO'
}

export type SpaType = {
  __typename?: 'SPAType';
  name?: Maybe<SpaChoices>;
};

export type SampleType = {
  __typename?: 'SampleType';
  isActive: Scalars['Boolean']['output'];
  lastModified?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
};

export enum SelahTeamEnum {
  BowtieRiversideOutreach = 'BOWTIE_RIVERSIDE_OUTREACH',
  EchoParkOnSite = 'ECHO_PARK_ON_SITE',
  EchoParkOutreach = 'ECHO_PARK_OUTREACH',
  HollywoodOnSite = 'HOLLYWOOD_ON_SITE',
  HollywoodOutreach = 'HOLLYWOOD_OUTREACH',
  LaRiverOutreach = 'LA_RIVER_OUTREACH',
  LosFelizOutreach = 'LOS_FELIZ_OUTREACH',
  NortheastHollywoodOutreach = 'NORTHEAST_HOLLYWOOD_OUTREACH',
  SilverLakeOutreach = 'SILVER_LAKE_OUTREACH',
  SlccOnSite = 'SLCC_ON_SITE',
  SundaySocialAtwaterOnSite = 'SUNDAY_SOCIAL_ATWATER_ON_SITE',
  SundaySocialAtwaterOutreach = 'SUNDAY_SOCIAL_ATWATER_OUTREACH',
  WdiOnSite = 'WDI_ON_SITE',
  WdiOutreach = 'WDI_OUTREACH'
}

export enum ServiceEnum {
  Bag = 'BAG',
  Batteries = 'BATTERIES',
  Bicycle = 'BICYCLE',
  BicycleRepair = 'BICYCLE_REPAIR',
  BirthCertificate = 'BIRTH_CERTIFICATE',
  Blanket = 'BLANKET',
  Book = 'BOOK',
  CaliforniaLifelinePhone = 'CALIFORNIA_LIFELINE_PHONE',
  Clothes = 'CLOTHES',
  ConsentToConnect = 'CONSENT_TO_CONNECT',
  ContactDpss = 'CONTACT_DPSS',
  ContactFriend = 'CONTACT_FRIEND',
  Dental = 'DENTAL',
  DiscountScooterRides = 'DISCOUNT_SCOOTER_RIDES',
  DmhEvaluation = 'DMH_EVALUATION',
  DmvNoFeeIdForm = 'DMV_NO_FEE_ID_FORM',
  Ebt = 'EBT',
  FamilyReunification = 'FAMILY_REUNIFICATION',
  FeminineHygiene = 'FEMININE_HYGIENE',
  FirstAid = 'FIRST_AID',
  Food = 'FOOD',
  HarmReduction = 'HARM_REDUCTION',
  HmisConsent = 'HMIS_CONSENT',
  HygieneKit = 'HYGIENE_KIT',
  InternetAccess = 'INTERNET_ACCESS',
  Lahop = 'LAHOP',
  LegalCounsel = 'LEGAL_COUNSEL',
  MailPickUp = 'MAIL_PICK_UP',
  Medical = 'MEDICAL',
  MediCal = 'MEDI_CAL',
  MetroLifeTap = 'METRO_LIFE_TAP',
  Other = 'OTHER',
  PetCare = 'PET_CARE',
  PetFood = 'PET_FOOD',
  PublicBenefitsPrograms = 'PUBLIC_BENEFITS_PROGRAMS',
  Ride = 'RIDE',
  SafeParking = 'SAFE_PARKING',
  Shelter = 'SHELTER',
  Shoes = 'SHOES',
  Shower = 'SHOWER',
  SleepingBag = 'SLEEPING_BAG',
  SocialSecurityCardReplacement = 'SOCIAL_SECURITY_CARD_REPLACEMENT',
  SsiSsdi = 'SSI_SSDI',
  Stabilize = 'STABILIZE',
  StimulusAssistance = 'STIMULUS_ASSISTANCE',
  Storage = 'STORAGE',
  StorageBelongings = 'STORAGE_BELONGINGS',
  StorageDocuments = 'STORAGE_DOCUMENTS',
  Tarp = 'TARP',
  Tent = 'TENT',
  TherapistAppointment = 'THERAPIST_APPOINTMENT',
  Transport = 'TRANSPORT',
  UnemploymentCertification = 'UNEMPLOYMENT_CERTIFICATION',
  VaccinePassport = 'VACCINE_PASSPORT',
  Water = 'WATER'
}

export enum ServiceRequestStatusEnum {
  Completed = 'COMPLETED',
  ToDo = 'TO_DO'
}

export type ServiceRequestType = {
  __typename?: 'ServiceRequestType';
  client?: Maybe<UserType>;
  completedOn?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  dueBy?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  service: ServiceEnum;
  serviceOther?: Maybe<Scalars['String']['output']>;
  status: ServiceRequestStatusEnum;
};

export enum ServiceRequestTypeEnum {
  Provided = 'PROVIDED',
  Requested = 'REQUESTED'
}

export enum ShelterChoices {
  Building = 'BUILDING',
  Church = 'CHURCH',
  HotelMotel = 'HOTEL_MOTEL',
  Other = 'OTHER',
  SafeParking = 'SAFE_PARKING',
  SingleFamilyHouse = 'SINGLE_FAMILY_HOUSE',
  TinyHomes = 'TINY_HOMES'
}

export type ShelterFilter = {
  AND?: InputMaybe<ShelterFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ShelterFilter>;
  OR?: InputMaybe<ShelterFilter>;
  geolocation?: InputMaybe<GeolocationInput>;
  properties?: InputMaybe<ShelterPropertyInput>;
};

export type ShelterLocationType = {
  __typename?: 'ShelterLocationType';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  place: Scalars['String']['output'];
};

export type ShelterOrder = {
  name?: InputMaybe<Ordering>;
};

export type ShelterPhotoType = {
  __typename?: 'ShelterPhotoType';
  createdAt: Scalars['DateTime']['output'];
  file: DjangoFileType;
  id: Scalars['ID']['output'];
};

export enum ShelterProgramChoices {
  BridgeHome = 'BRIDGE_HOME',
  CrisisHousing = 'CRISIS_HOUSING',
  EmergencyShelter = 'EMERGENCY_SHELTER',
  FaithBased = 'FAITH_BASED',
  InterimHousing = 'INTERIM_HOUSING',
  Other = 'OTHER',
  PermanentHousing = 'PERMANENT_HOUSING',
  ProjectHomeKey = 'PROJECT_HOME_KEY',
  RapidRehousing = 'RAPID_REHOUSING',
  RecuperativeCare = 'RECUPERATIVE_CARE',
  RoadmapHome = 'ROADMAP_HOME',
  SafeParkLa = 'SAFE_PARK_LA',
  SoberLiving = 'SOBER_LIVING',
  TinyHomeVillage = 'TINY_HOME_VILLAGE',
  TransitionalHousing = 'TRANSITIONAL_HOUSING',
  WinterShelter = 'WINTER_SHELTER'
}

export type ShelterProgramType = {
  __typename?: 'ShelterProgramType';
  name?: Maybe<ShelterProgramChoices>;
};

export type ShelterPropertyInput = {
  demographics?: InputMaybe<Array<DemographicChoices>>;
  parking?: InputMaybe<Array<ParkingChoices>>;
  pets?: InputMaybe<Array<PetChoices>>;
  roomStyles?: InputMaybe<Array<RoomStyleChoices>>;
  shelterTypes?: InputMaybe<Array<ShelterChoices>>;
  specialSituationRestrictions?: InputMaybe<Array<SpecialSituationRestrictionChoices>>;
};

export type ShelterType = {
  __typename?: 'ShelterType';
  ExteriorPhotos?: Maybe<Array<ShelterPhotoType>>;
  InteriorPhotos?: Maybe<Array<ShelterPhotoType>>;
  accessibility: Array<AccessibilityType>;
  additionalContacts: Array<ContactInfoType>;
  bedFees?: Maybe<Scalars['String']['output']>;
  cities: Array<CityType>;
  cityCouncilDistrict?: Maybe<Scalars['Int']['output']>;
  curfew?: Maybe<Scalars['Time']['output']>;
  demographics: Array<DemographicType>;
  demographicsOther?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  distanceInMiles?: Maybe<Scalars['Float']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  entryInfo?: Maybe<Scalars['String']['output']>;
  entryRequirements: Array<EntryRequirementType>;
  exteriorPhotos: Array<ShelterPhotoType>;
  funders: Array<FunderType>;
  fundersOther?: Maybe<Scalars['String']['output']>;
  generalServices: Array<GeneralServiceType>;
  healthServices: Array<HealthServiceType>;
  heroImage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  immediateNeeds: Array<ImmediateNeedType>;
  interiorPhotos: Array<ShelterPhotoType>;
  location?: Maybe<ShelterLocationType>;
  maxStay?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  onSiteSecurity?: Maybe<Scalars['Boolean']['output']>;
  organization?: Maybe<OrganizationType>;
  otherRules?: Maybe<Scalars['String']['output']>;
  otherServices?: Maybe<Scalars['String']['output']>;
  overallRating?: Maybe<Scalars['Int']['output']>;
  parking: Array<ParkingType>;
  pets: Array<PetType>;
  phone: Scalars['PhoneNumber']['output'];
  programFees?: Maybe<Scalars['String']['output']>;
  roomStyles: Array<RoomStyleType>;
  roomStylesOther?: Maybe<Scalars['String']['output']>;
  shelterPrograms: Array<ShelterProgramType>;
  shelterProgramsOther?: Maybe<Scalars['String']['output']>;
  shelterTypes: Array<ShelterTypeType>;
  shelterTypesOther?: Maybe<Scalars['String']['output']>;
  spa: Array<SpaType>;
  specialSituationRestrictions: Array<SpecialSituationRestrictionType>;
  status: StatusChoices;
  storage: Array<StorageType>;
  subjectiveReview?: Maybe<Scalars['String']['output']>;
  supervisorialDistrict?: Maybe<Scalars['Int']['output']>;
  totalBeds?: Maybe<Scalars['Int']['output']>;
  trainingServices: Array<TrainingServiceType>;
  website?: Maybe<Scalars['String']['output']>;
};

export type ShelterTypeOffsetPaginated = {
  __typename?: 'ShelterTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ShelterType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type ShelterTypeType = {
  __typename?: 'ShelterTypeType';
  name?: Maybe<ShelterChoices>;
};

export enum SocialMediaEnum {
  Facebook = 'FACEBOOK',
  Instagram = 'INSTAGRAM',
  Linkedin = 'LINKEDIN',
  Snapchat = 'SNAPCHAT',
  Tiktok = 'TIKTOK',
  Twitter = 'TWITTER',
  Whatsapp = 'WHATSAPP'
}

export type SocialMediaProfileInput = {
  clientProfile?: InputMaybe<OneToManyInput>;
  id?: InputMaybe<Scalars['ID']['input']>;
  platform?: InputMaybe<SocialMediaEnum>;
  platformUserId?: InputMaybe<Scalars['String']['input']>;
};

export type SocialMediaProfileType = {
  __typename?: 'SocialMediaProfileType';
  clientProfile: DjangoModelType;
  id?: Maybe<Scalars['ID']['output']>;
  platform: SocialMediaEnum;
  platformUserId: Scalars['String']['output'];
};

export enum SpecialSituationRestrictionChoices {
  DomesticViolence = 'DOMESTIC_VIOLENCE',
  HivAids = 'HIV_AIDS',
  HumanTrafficking = 'HUMAN_TRAFFICKING',
  JusticeSystems = 'JUSTICE_SYSTEMS',
  LgbtqPlus = 'LGBTQ_PLUS',
  None = 'NONE',
  Veterans = 'VETERANS'
}

export type SpecialSituationRestrictionType = {
  __typename?: 'SpecialSituationRestrictionType';
  name?: Maybe<SpecialSituationRestrictionChoices>;
};

export enum StatusChoices {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

export enum StorageChoices {
  AmnestyLockers = 'AMNESTY_LOCKERS',
  NoStorage = 'NO_STORAGE',
  SharedStorage = 'SHARED_STORAGE',
  StandardLockers = 'STANDARD_LOCKERS'
}

export type StorageType = {
  __typename?: 'StorageType';
  name?: Maybe<StorageChoices>;
};

export type SwitchType = {
  __typename?: 'SwitchType';
  isActive: Scalars['Boolean']['output'];
  lastModified?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
};

export type TaskOrder = {
  dueBy?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
};

export enum TaskStatusEnum {
  Completed = 'COMPLETED',
  ToDo = 'TO_DO'
}

export type TaskType = {
  __typename?: 'TaskType';
  client?: Maybe<UserType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  dueBy?: Maybe<Scalars['DateTime']['output']>;
  dueByGroup: DueByGroupEnum;
  id: Scalars['ID']['output'];
  location?: Maybe<LocationType>;
  status: TaskStatusEnum;
  title: Scalars['String']['output'];
};

export enum TaskTypeEnum {
  NextStep = 'NEXT_STEP',
  Purpose = 'PURPOSE'
}

export enum TrainingServiceChoices {
  JobTraining = 'JOB_TRAINING',
  LifeSkillsTraining = 'LIFE_SKILLS_TRAINING',
  Tutoring = 'TUTORING'
}

export type TrainingServiceType = {
  __typename?: 'TrainingServiceType';
  name?: Maybe<TrainingServiceChoices>;
};

export type UpdateClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<ClientContactInput>>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  gender?: InputMaybe<GenderEnum>;
  genderOther?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  hmisProfiles?: InputMaybe<Array<HmisProfileInput>>;
  householdMembers?: InputMaybe<Array<ClientHouseholdMemberInput>>;
  id: Scalars['ID']['input'];
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['PhoneNumber']['input']>;
  phoneNumbers?: InputMaybe<Array<PhoneNumberInput>>;
  physicalDescription?: InputMaybe<Scalars['String']['input']>;
  placeOfBirth?: InputMaybe<Scalars['String']['input']>;
  preferredCommunication?: InputMaybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  profilePhoto?: InputMaybe<Scalars['Upload']['input']>;
  pronouns?: InputMaybe<PronounEnum>;
  pronounsOther?: InputMaybe<Scalars['String']['input']>;
  race?: InputMaybe<RaceEnum>;
  residenceAddress?: InputMaybe<Scalars['String']['input']>;
  socialMediaProfiles?: InputMaybe<Array<SocialMediaProfileInput>>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  user?: InputMaybe<UpdateUserInput>;
  veteranStatus?: InputMaybe<VeteranStatusEnum>;
};

export type UpdateClientProfilePayload = ClientProfileType | OperationInfo;

export type UpdateClientProfilePhotoPayload = ClientProfileType | OperationInfo;

export type UpdateCurrentUserPayload = OperationInfo | UserType;

export type UpdateNoteInput = {
  id: Scalars['ID']['input'];
  interactedAt?: InputMaybe<Scalars['DateTime']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['ID']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  team?: InputMaybe<SelahTeamEnum>;
};

export type UpdateNoteLocationInput = {
  id: Scalars['ID']['input'];
  location: LocationInput;
};

export type UpdateNoteLocationPayload = NoteType | OperationInfo;

export type UpdateNotePayload = NoteType | OperationInfo;

export type UpdateServiceRequestInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ServiceRequestStatusEnum>;
};

export type UpdateServiceRequestPayload = OperationInfo | ServiceRequestType;

export type UpdateTaskInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  location?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<TaskStatusEnum>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskLocationInput = {
  id: Scalars['ID']['input'];
  location: LocationInput;
};

export type UpdateTaskLocationPayload = OperationInfo | TaskType;

export type UpdateTaskPayload = OperationInfo | TaskType;

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  hasAcceptedPrivacyPolicy?: InputMaybe<Scalars['Boolean']['input']>;
  hasAcceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type UserType = {
  __typename?: 'UserType';
  clientProfile?: Maybe<DjangoModelType>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  hasAcceptedPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  hasAcceptedTos?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  isOutreachAuthorized?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  middleName?: Maybe<Scalars['String']['output']>;
  organizationsOrganization?: Maybe<Array<OrganizationType>>;
  username: Scalars['String']['output'];
};

export enum VeteranStatusEnum {
  No = 'NO',
  OtherThanHonorable = 'OTHER_THAN_HONORABLE',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
  Yes = 'YES'
}
