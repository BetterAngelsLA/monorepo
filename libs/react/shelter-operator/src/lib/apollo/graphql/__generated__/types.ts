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
  LatitudeScalar: { input: any; output: any; }
  LongitudeScalar: { input: any; output: any; }
  NonBlankString: { input: string; output: string; }
  PhoneNumber: { input: any; output: any; }
  /** Represents a point as `(x, y, z)` or `(x, y)`. */
  Point: { input: any; output: any; }
  /** Time (isoformat) */
  Time: { input: any; output: any; }
  UUID: { input: any; output: any; }
  /** Represents a file upload. */
  Upload: { input: any; output: any; }
};

export enum AccessibilityChoices {
  AdaRooms = 'ADA_ROOMS',
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

export type AddOrganizationMemberPayload = OperationInfo | OrganizationMemberType;

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

export type AuthResponse = {
  __typename?: 'AuthResponse';
  status_code: Scalars['String']['output'];
};

export enum BedStatusChoices {
  Available = 'AVAILABLE',
  Reserved = 'RESERVED'
}

export type BedType = {
  __typename?: 'BedType';
  id: Scalars['ID']['output'];
  shelter: ShelterType;
  status?: Maybe<BedStatusChoices>;
};

export type CityType = {
  __typename?: 'CityType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type ClientContactInput = {
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
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
  updatedAt: Scalars['DateTime']['output'];
};

export type ClientContactTypeOffsetPaginated = {
  __typename?: 'ClientContactTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ClientContactType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type ClientDocumentFilter = {
  AND?: InputMaybe<ClientDocumentFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ClientDocumentFilter>;
  OR?: InputMaybe<ClientDocumentFilter>;
  documentGroups?: InputMaybe<Array<ClientDocumentGroupEnum>>;
};

export enum ClientDocumentGroupEnum {
  DocReady = 'DOC_READY',
  Forms = 'FORMS',
  Other = 'OTHER'
}

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
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
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

export type ClientHouseholdMemberTypeOffsetPaginated = {
  __typename?: 'ClientHouseholdMemberTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<ClientHouseholdMemberType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
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
  firstName?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  lastName?: InputMaybe<Ordering>;
};

export type ClientProfilePhotoInput = {
  clientProfile: Scalars['ID']['input'];
  photo?: InputMaybe<Scalars['Upload']['input']>;
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
  email?: Maybe<Scalars['NonBlankString']['output']>;
  eyeColor?: Maybe<EyeColorEnum>;
  firstName?: Maybe<Scalars['NonBlankString']['output']>;
  gender?: Maybe<GenderEnum>;
  genderOther?: Maybe<Scalars['String']['output']>;
  hairColor?: Maybe<HairColorEnum>;
  heightInInches?: Maybe<Scalars['Float']['output']>;
  hmisProfiles?: Maybe<Array<HmisProfileType>>;
  householdMembers?: Maybe<Array<ClientHouseholdMemberType>>;
  id: Scalars['ID']['output'];
  importantNotes?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['NonBlankString']['output']>;
  livingSituation?: Maybe<LivingSituationEnum>;
  mailingAddress?: Maybe<Scalars['String']['output']>;
  maritalStatus?: Maybe<MaritalStatusEnum>;
  middleName?: Maybe<Scalars['NonBlankString']['output']>;
  nickname?: Maybe<Scalars['NonBlankString']['output']>;
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
  residenceGeolocation?: Maybe<Scalars['Point']['output']>;
  socialMediaProfiles?: Maybe<Array<SocialMediaProfileType>>;
  spokenLanguages?: Maybe<Array<LanguageEnum>>;
  veteranStatus?: Maybe<VeteranStatusEnum>;
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

export type CreateBedInput = {
  shelterId: Scalars['ID']['input'];
  status: BedStatusChoices;
};

export type CreateClientContactPayload = ClientContactType | OperationInfo;

export type CreateClientDocumentInput = {
  clientProfile: Scalars['ID']['input'];
  file: Scalars['Upload']['input'];
  namespace: ClientDocumentNamespaceEnum;
};

export type CreateClientDocumentPayload = ClientDocumentType | OperationInfo;

export type CreateClientHouseholdMemberPayload = ClientHouseholdMemberType | OperationInfo;

export type CreateClientProfileDataImportPayload = ClientProfileDataImportType | OperationInfo;

export type CreateClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<ClientContactInput>>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['NonBlankString']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  firstName?: InputMaybe<Scalars['NonBlankString']['input']>;
  gender?: InputMaybe<GenderEnum>;
  genderOther?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  hmisProfiles?: InputMaybe<Array<HmisProfileInput>>;
  householdMembers?: InputMaybe<Array<ClientHouseholdMemberInput>>;
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['NonBlankString']['input']>;
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  middleName?: InputMaybe<Scalars['NonBlankString']['input']>;
  nickname?: InputMaybe<Scalars['NonBlankString']['input']>;
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
  residenceGeolocation?: InputMaybe<Scalars['Point']['input']>;
  socialMediaProfiles?: InputMaybe<Array<SocialMediaProfileInput>>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  veteranStatus?: InputMaybe<VeteranStatusEnum>;
};

export type CreateClientProfilePayload = ClientProfileType | OperationInfo;

export type CreateHmisClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  additionalRaceEthnicityDetail?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  alias?: InputMaybe<Scalars['String']['input']>;
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  dobQuality?: InputMaybe<HmisDobQualityEnum>;
  email?: InputMaybe<Scalars['NonBlankString']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  firstName: Scalars['NonBlankString']['input'];
  gender?: InputMaybe<Array<HmisGenderEnum>>;
  genderIdentityText?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['NonBlankString']['input'];
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  nameMiddle?: InputMaybe<Scalars['NonBlankString']['input']>;
  nameQuality: HmisNameQualityEnum;
  nameSuffix?: InputMaybe<HmisSuffixEnum>;
  physicalDescription?: InputMaybe<Scalars['String']['input']>;
  placeOfBirth?: InputMaybe<Scalars['String']['input']>;
  preferredCommunication?: InputMaybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  profilePhoto?: InputMaybe<Scalars['Upload']['input']>;
  pronouns?: InputMaybe<PronounEnum>;
  pronounsOther?: InputMaybe<Scalars['String']['input']>;
  raceEthnicity?: InputMaybe<Array<HmisRaceEnum>>;
  residenceAddress?: InputMaybe<Scalars['String']['input']>;
  residenceGeolocation?: InputMaybe<Scalars['Point']['input']>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  ssn1?: InputMaybe<Scalars['String']['input']>;
  ssn2?: InputMaybe<Scalars['String']['input']>;
  ssn3?: InputMaybe<Scalars['String']['input']>;
  ssnQuality?: InputMaybe<HmisSsnQualityEnum>;
  veteran?: InputMaybe<HmisVeteranStatusEnum>;
};

export type CreateHmisClientProfilePayload = HmisClientProfileType | OperationInfo;

export type CreateHmisClientProgramPayload = OperationInfo | ProgramEnrollmentType;

export type CreateHmisNoteInput = {
  date: Scalars['Date']['input'];
  hmisClientProfileId: Scalars['String']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  refClientProgram?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateHmisNotePayload = HmisNoteType | OperationInfo;

export type CreateHmisNoteServiceRequestInput = {
  hmisNoteId: Scalars['ID']['input'];
  serviceId?: InputMaybe<Scalars['ID']['input']>;
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  serviceRequestType: ServiceRequestTypeEnum;
};

export type CreateHmisNoteServiceRequestPayload = OperationInfo | ServiceRequestType;

export type CreateHmisProfilePayload = HmisProfileType | OperationInfo;

export type CreateNoteDataImportInput = {
  notes: Scalars['String']['input'];
  sourceFile: Scalars['String']['input'];
};

export type CreateNoteDataImportPayload = NoteDataImportType | OperationInfo;

export type CreateNoteInput = {
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
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
  serviceId?: InputMaybe<Scalars['ID']['input']>;
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  serviceRequestType: ServiceRequestTypeEnum;
};

export type CreateNoteServiceRequestPayload = OperationInfo | ServiceRequestType;

export type CreateProfileDataImportInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  sourceFile: Scalars['String']['input'];
};

export type CreateServiceRequestInput = {
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  serviceId?: InputMaybe<Scalars['ID']['input']>;
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  status: ServiceRequestStatusEnum;
};

export type CreateServiceRequestPayload = OperationInfo | ServiceRequestType;

export type CreateSocialMediaProfilePayload = OperationInfo | SocialMediaProfileType;

export type CreateTaskInput = {
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hmisClientProfile?: InputMaybe<Scalars['ID']['input']>;
  hmisNote?: InputMaybe<Scalars['ID']['input']>;
  note?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<TaskStatusEnum>;
  summary: Scalars['String']['input'];
  team?: InputMaybe<SelahTeamEnum>;
};

export type CreateTaskPayload = OperationInfo | TaskType;

export type CurrentUserOrganizationType = {
  __typename?: 'CurrentUserOrganizationType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  userPermissions?: Maybe<Array<UserOrganizationPermissions>>;
};

export type CurrentUserType = {
  __typename?: 'CurrentUserType';
  email?: Maybe<Scalars['NonBlankString']['output']>;
  firstName?: Maybe<Scalars['NonBlankString']['output']>;
  hasAcceptedPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  hasAcceptedTos?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  isHmisUser?: Maybe<Scalars['Boolean']['output']>;
  isOutreachAuthorized?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['NonBlankString']['output']>;
  middleName?: Maybe<Scalars['NonBlankString']['output']>;
  organizationsOrganization?: Maybe<Array<CurrentUserOrganizationType>>;
  username?: Maybe<Scalars['String']['output']>;
};


export type CurrentUserTypeOrganizationsOrganizationArgs = {
  filters?: InputMaybe<OrganizationFilter>;
  ordering?: Array<OrganizationOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type DeleteClientContactPayload = ClientContactType | OperationInfo;

export type DeleteClientDocumentPayload = ClientDocumentType | OperationInfo;

export type DeleteClientHouseholdMemberPayload = ClientHouseholdMemberType | OperationInfo;

export type DeleteClientProfilePayload = DeletedObjectType | OperationInfo;

export type DeleteCurrentUserPayload = DeletedObjectType | OperationInfo;

export type DeleteDjangoObjectInput = {
  id: Scalars['ID']['input'];
};

export type DeleteHmisProfilePayload = HmisProfileType | OperationInfo;

export type DeleteMoodPayload = DeletedObjectType | OperationInfo;

export type DeleteNotePayload = NoteType | OperationInfo;

export type DeleteServiceRequestPayload = DeletedObjectType | OperationInfo;

export type DeleteSocialMediaProfilePayload = OperationInfo | SocialMediaProfileType;

export type DeleteTaskPayload = DeletedObjectType | OperationInfo;

export type DeletedObjectType = {
  __typename?: 'DeletedObjectType';
  id: Scalars['Int']['output'];
};

export enum DemographicChoices {
  All = 'ALL',
  Families = 'FAMILIES',
  LgbtqPlus = 'LGBTQ_PLUS',
  Other = 'OTHER',
  Seniors = 'SENIORS',
  SingleDads = 'SINGLE_DADS',
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

export type DjangoModelFilterInput = {
  pk: Scalars['ID']['input'];
};

export type DjangoModelType = {
  __typename?: 'DjangoModelType';
  pk: Scalars['ID']['output'];
};

export enum EntryRequirementChoices {
  Background = 'BACKGROUND',
  HomelessVerification = 'HOMELESS_VERIFICATION',
  MedicaidOrMedicare = 'MEDICAID_OR_MEDICARE',
  PhotoId = 'PHOTO_ID',
  Referral = 'REFERRAL',
  Reservation = 'RESERVATION',
  VehicleRegistration = 'VEHICLE_REGISTRATION',
  WalkUps = 'WALK_UPS'
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
  Laundry = 'LAUNDRY',
  LegalAssistance = 'LEGAL_ASSISTANCE',
  Mail = 'MAIL',
  Phone = 'PHONE',
  Tls = 'TLS',
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

export type HmisClientProfileFilter = {
  AND?: InputMaybe<HmisClientProfileFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<HmisClientProfileFilter>;
  OR?: InputMaybe<HmisClientProfileFilter>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type HmisClientProfileOrdering = {
  addedDate?: InputMaybe<Ordering>;
  firstName?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  lastName?: InputMaybe<Ordering>;
  lastUpdated?: InputMaybe<Ordering>;
};

export type HmisClientProfileType = {
  __typename?: 'HmisClientProfileType';
  adaAccommodation?: Maybe<Array<AdaAccommodationEnum>>;
  addedDate?: Maybe<Scalars['DateTime']['output']>;
  additionalRaceEthnicityDetail?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  age?: Maybe<Scalars['Int']['output']>;
  alias?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['Date']['output']>;
  californiaId?: Maybe<Scalars['String']['output']>;
  createdBy?: Maybe<UserType>;
  dobQuality?: Maybe<HmisDobQualityEnum>;
  email?: Maybe<Scalars['NonBlankString']['output']>;
  eyeColor?: Maybe<EyeColorEnum>;
  firstName?: Maybe<Scalars['NonBlankString']['output']>;
  gender?: Maybe<Array<HmisGenderEnum>>;
  genderIdentityText?: Maybe<Scalars['String']['output']>;
  hairColor?: Maybe<HairColorEnum>;
  heightInInches?: Maybe<Scalars['Float']['output']>;
  hmisId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  importantNotes?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['NonBlankString']['output']>;
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
  livingSituation?: Maybe<LivingSituationEnum>;
  mailingAddress?: Maybe<Scalars['String']['output']>;
  maritalStatus?: Maybe<MaritalStatusEnum>;
  nameMiddle?: Maybe<Scalars['NonBlankString']['output']>;
  nameQuality?: Maybe<HmisNameQualityEnum>;
  nameSuffix?: Maybe<HmisSuffixEnum>;
  personalId?: Maybe<Scalars['String']['output']>;
  phoneNumbers?: Maybe<Array<PhoneNumberType>>;
  physicalDescription?: Maybe<Scalars['String']['output']>;
  placeOfBirth?: Maybe<Scalars['String']['output']>;
  preferredCommunication?: Maybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: Maybe<LanguageEnum>;
  profilePhoto?: Maybe<DjangoImageType>;
  pronouns?: Maybe<PronounEnum>;
  pronounsOther?: Maybe<Scalars['String']['output']>;
  raceEthnicity?: Maybe<Array<HmisRaceEnum>>;
  residenceAddress?: Maybe<Scalars['String']['output']>;
  residenceGeolocation?: Maybe<Scalars['Point']['output']>;
  spokenLanguages?: Maybe<Array<LanguageEnum>>;
  ssn1?: Maybe<Scalars['String']['output']>;
  ssn2?: Maybe<Scalars['String']['output']>;
  ssn3?: Maybe<Scalars['String']['output']>;
  ssnQuality?: Maybe<HmisSsnQualityEnum>;
  uniqueIdentifier?: Maybe<Scalars['String']['output']>;
  veteran?: Maybe<HmisVeteranStatusEnum>;
};

export type HmisClientProfileTypeOffsetPaginated = {
  __typename?: 'HmisClientProfileTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<HmisClientProfileType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type HmisClientProgramType = {
  __typename?: 'HmisClientProgramType';
  id: Scalars['String']['output'];
  program: HmisProgramType;
};

export enum HmisDobQualityEnum {
  DontKnow = 'DONT_KNOW',
  Full = 'FULL',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  Partial = 'PARTIAL'
}

export enum HmisGenderEnum {
  Different = 'DIFFERENT',
  DontKnow = 'DONT_KNOW',
  ManBoy = 'MAN_BOY',
  NonBinary = 'NON_BINARY',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  Questioning = 'QUESTIONING',
  Specific = 'SPECIFIC',
  Transgender = 'TRANSGENDER',
  WomanGirl = 'WOMAN_GIRL'
}

export type HmisLoginError = {
  __typename?: 'HmisLoginError';
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type HmisLoginSuccess = {
  __typename?: 'HmisLoginSuccess';
  user: CurrentUserType;
};

export type HmisLoginSuccessHmisLoginError = HmisLoginError | HmisLoginSuccess;

export enum HmisNameQualityEnum {
  DontKnow = 'DONT_KNOW',
  Full = 'FULL',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  Partial = 'PARTIAL'
}

export type HmisNoteFilter = {
  AND?: InputMaybe<HmisNoteFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<HmisNoteFilter>;
  OR?: InputMaybe<HmisNoteFilter>;
  authors?: InputMaybe<Array<Scalars['ID']['input']>>;
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  hmisClientProfile?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type HmisNoteOrdering = {
  addedDate?: InputMaybe<Ordering>;
  date?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  lastUpdated?: InputMaybe<Ordering>;
};

export type HmisNoteType = {
  __typename?: 'HmisNoteType';
  addedDate?: Maybe<Scalars['DateTime']['output']>;
  clientProgram?: Maybe<HmisClientProgramType>;
  createdBy?: Maybe<UserType>;
  date?: Maybe<Scalars['Date']['output']>;
  hmisClientProfile: HmisClientProfileType;
  hmisId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
  location?: Maybe<LocationType>;
  note: Scalars['String']['output'];
  providedServices?: Maybe<Array<ServiceRequestType>>;
  refClientProgram?: Maybe<Scalars['String']['output']>;
  requestedServices?: Maybe<Array<ServiceRequestType>>;
  tasks?: Maybe<Array<TaskType>>;
  title?: Maybe<Scalars['String']['output']>;
};


export type HmisNoteTypeProvidedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type HmisNoteTypeRequestedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type HmisNoteTypeTasksArgs = {
  filters?: InputMaybe<TaskFilter>;
  ordering?: Array<TaskOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type HmisNoteTypeOffsetPaginated = {
  __typename?: 'HmisNoteTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<HmisNoteType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type HmisProfileInput = {
  agency: HmisAgencyEnum;
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  hmisId?: InputMaybe<Scalars['NonBlankString']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type HmisProfileType = {
  __typename?: 'HmisProfileType';
  agency: HmisAgencyEnum;
  hmisId?: Maybe<Scalars['NonBlankString']['output']>;
  id: Scalars['ID']['output'];
};

export type HmisProfileTypeOffsetPaginated = {
  __typename?: 'HmisProfileTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<HmisProfileType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type HmisProgramType = {
  __typename?: 'HmisProgramType';
  enableNotes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum HmisRaceEnum {
  Asian = 'ASIAN',
  Black = 'BLACK',
  DontKnow = 'DONT_KNOW',
  Hispanic = 'HISPANIC',
  Indigenous = 'INDIGENOUS',
  MiddleEastern = 'MIDDLE_EASTERN',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  PacificIslander = 'PACIFIC_ISLANDER',
  White = 'WHITE'
}

export enum HmisSsnQualityEnum {
  DontKnow = 'DONT_KNOW',
  Full = 'FULL',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  Partial = 'PARTIAL'
}

export enum HmisSuffixEnum {
  DontKnow = 'DONT_KNOW',
  Fifth = 'FIFTH',
  First = 'FIRST',
  Fourth = 'FOURTH',
  Jr = 'JR',
  NoAnswer = 'NO_ANSWER',
  Second = 'SECOND',
  Sixth = 'SIXTH',
  Sr = 'SR',
  Third = 'THIRD'
}

export enum HmisVeteranStatusEnum {
  DontKnow = 'DONT_KNOW',
  No = 'NO',
  NotCollected = 'NOT_COLLECTED',
  NoAnswer = 'NO_ANSWER',
  Yes = 'YES'
}

export type IdFilterLookup = {
  /** Case-sensitive containment test. Filter will be skipped on `null` value */
  contains?: InputMaybe<Scalars['ID']['input']>;
  /** Case-sensitive ends-with. Filter will be skipped on `null` value */
  endsWith?: InputMaybe<Scalars['ID']['input']>;
  /** Exact match. Filter will be skipped on `null` value */
  exact?: InputMaybe<Scalars['ID']['input']>;
  /** Case-insensitive containment test. Filter will be skipped on `null` value */
  iContains?: InputMaybe<Scalars['ID']['input']>;
  /** Case-insensitive ends-with. Filter will be skipped on `null` value */
  iEndsWith?: InputMaybe<Scalars['ID']['input']>;
  /** Case-insensitive exact match. Filter will be skipped on `null` value */
  iExact?: InputMaybe<Scalars['ID']['input']>;
  /** Case-insensitive regular expression match. Filter will be skipped on `null` value */
  iRegex?: InputMaybe<Scalars['ID']['input']>;
  /** Case-insensitive starts-with. Filter will be skipped on `null` value */
  iStartsWith?: InputMaybe<Scalars['ID']['input']>;
  /** Exact match of items in a given list. Filter will be skipped on `null` value */
  inList?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** Assignment test. Filter will be skipped on `null` value */
  isNull?: InputMaybe<Scalars['Boolean']['input']>;
  /** Case-sensitive regular expression match. Filter will be skipped on `null` value */
  regex?: InputMaybe<Scalars['ID']['input']>;
  /** Case-sensitive starts-with. Filter will be skipped on `null` value */
  startsWith?: InputMaybe<Scalars['ID']['input']>;
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
  id?: Maybe<Scalars['ID']['output']>;
  point: Scalars['Point']['output'];
  pointOfInterest?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MapBoundsInput = {
  eastLng: Scalars['LongitudeScalar']['input'];
  northLat: Scalars['LatitudeScalar']['input'];
  southLat: Scalars['LatitudeScalar']['input'];
  westLng: Scalars['LongitudeScalar']['input'];
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
  addOrganizationMember: AddOrganizationMemberPayload;
  createBed: BedType;
  createClientContact: CreateClientContactPayload;
  createClientDocument: CreateClientDocumentPayload;
  createClientHouseholdMember: CreateClientHouseholdMemberPayload;
  createClientProfile: CreateClientProfilePayload;
  createClientProfileDataImport: CreateClientProfileDataImportPayload;
  createHmisClientProfile: CreateHmisClientProfilePayload;
  createHmisClientProgram: CreateHmisClientProgramPayload;
  createHmisNote: CreateHmisNotePayload;
  createHmisNoteServiceRequest: CreateHmisNoteServiceRequestPayload;
  createHmisProfile: CreateHmisProfilePayload;
  createNote: CreateNotePayload;
  createNoteDataImport: CreateNoteDataImportPayload;
  createNoteMood: CreateNoteMoodPayload;
  createNoteServiceRequest: CreateNoteServiceRequestPayload;
  createServiceRequest: CreateServiceRequestPayload;
  createSocialMediaProfile: CreateSocialMediaProfilePayload;
  createTask: CreateTaskPayload;
  deleteClientContact: DeleteClientContactPayload;
  deleteClientDocument: DeleteClientDocumentPayload;
  deleteClientHouseholdMember: DeleteClientHouseholdMemberPayload;
  deleteClientProfile: DeleteClientProfilePayload;
  deleteCurrentUser: DeleteCurrentUserPayload;
  deleteHmisProfile: DeleteHmisProfilePayload;
  deleteMood: DeleteMoodPayload;
  deleteNote: DeleteNotePayload;
  deleteServiceRequest: DeleteServiceRequestPayload;
  deleteSocialMediaProfile: DeleteSocialMediaProfilePayload;
  deleteTask: DeleteTaskPayload;
  hmisLogin: HmisLoginSuccessHmisLoginError;
  importClientProfile: ImportClientProfilePayload;
  importNote: ImportNotePayload;
  login: AuthResponse;
  logout: Scalars['Boolean']['output'];
  removeHmisNoteServiceRequest: RemoveHmisNoteServiceRequestPayload;
  removeNoteServiceRequest: RemoveNoteServiceRequestPayload;
  removeOrganizationMember: RemoveOrganizationMemberPayload;
  revertNote: RevertNotePayload;
  updateClientContact: UpdateClientContactPayload;
  updateClientDocument: UpdateClientDocumentPayload;
  updateClientHouseholdMember: UpdateClientHouseholdMemberPayload;
  updateClientProfile: UpdateClientProfilePayload;
  updateClientProfilePhoto: UpdateClientProfilePhotoPayload;
  updateCurrentUser: UpdateCurrentUserPayload;
  updateHmisClientProfile: UpdateHmisClientProfilePayload;
  updateHmisNote: UpdateHmisNotePayload;
  updateHmisNoteLocation: UpdateHmisNoteLocationPayload;
  updateHmisProfile: UpdateHmisProfilePayload;
  updateNote: UpdateNotePayload;
  updateNoteLocation: UpdateNoteLocationPayload;
  updateServiceRequest: UpdateServiceRequestPayload;
  updateSocialMediaProfile: UpdateSocialMediaProfilePayload;
  updateTask: UpdateTaskPayload;
};


export type MutationAddOrganizationMemberArgs = {
  data: OrgInvitationInput;
};


export type MutationCreateBedArgs = {
  input: CreateBedInput;
};


export type MutationCreateClientContactArgs = {
  data: ClientContactInput;
};


export type MutationCreateClientDocumentArgs = {
  data: CreateClientDocumentInput;
};


export type MutationCreateClientHouseholdMemberArgs = {
  data: ClientHouseholdMemberInput;
};


export type MutationCreateClientProfileArgs = {
  data: CreateClientProfileInput;
};


export type MutationCreateClientProfileDataImportArgs = {
  data: CreateProfileDataImportInput;
};


export type MutationCreateHmisClientProfileArgs = {
  data: CreateHmisClientProfileInput;
};


export type MutationCreateHmisClientProgramArgs = {
  clientId: Scalars['Int']['input'];
  programHmisId: Scalars['Int']['input'];
};


export type MutationCreateHmisNoteArgs = {
  data: CreateHmisNoteInput;
};


export type MutationCreateHmisNoteServiceRequestArgs = {
  data: CreateHmisNoteServiceRequestInput;
};


export type MutationCreateHmisProfileArgs = {
  data: HmisProfileInput;
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


export type MutationCreateServiceRequestArgs = {
  data: CreateServiceRequestInput;
};


export type MutationCreateSocialMediaProfileArgs = {
  data: SocialMediaProfileInput;
};


export type MutationCreateTaskArgs = {
  data: CreateTaskInput;
};


export type MutationDeleteClientContactArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteClientDocumentArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteClientHouseholdMemberArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteClientProfileArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteHmisProfileArgs = {
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


export type MutationDeleteSocialMediaProfileArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationDeleteTaskArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationHmisLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
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


export type MutationRemoveHmisNoteServiceRequestArgs = {
  data: RemoveHmisNoteServiceRequestInput;
};


export type MutationRemoveNoteServiceRequestArgs = {
  data: RemoveNoteServiceRequestInput;
};


export type MutationRemoveOrganizationMemberArgs = {
  data: RemoveOrganizationMemberInput;
};


export type MutationRevertNoteArgs = {
  data: RevertNoteInput;
};


export type MutationUpdateClientContactArgs = {
  data: ClientContactInput;
};


export type MutationUpdateClientDocumentArgs = {
  data: UpdateClientDocumentInput;
};


export type MutationUpdateClientHouseholdMemberArgs = {
  data: ClientHouseholdMemberInput;
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


export type MutationUpdateHmisClientProfileArgs = {
  data: UpdateHmisClientProfileInput;
};


export type MutationUpdateHmisNoteArgs = {
  data: UpdateHmisNoteInput;
};


export type MutationUpdateHmisNoteLocationArgs = {
  data: UpdateHmisNoteLocationInput;
};


export type MutationUpdateHmisProfileArgs = {
  data: HmisProfileInput;
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


export type MutationUpdateSocialMediaProfileArgs = {
  data: SocialMediaProfileInput;
};


export type MutationUpdateTaskArgs = {
  data: UpdateTaskInput;
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
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  organizations?: InputMaybe<Array<Scalars['ID']['input']>>;
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
  clientProfile?: Maybe<ClientProfileType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<UserType>;
  id: Scalars['ID']['output'];
  interactedAt: Scalars['DateTime']['output'];
  isSubmitted: Scalars['Boolean']['output'];
  location?: Maybe<LocationType>;
  moods: Array<MoodType>;
  organization: OrganizationType;
  privateDetails?: Maybe<Scalars['String']['output']>;
  providedServices: Array<ServiceRequestType>;
  publicDetails: Scalars['String']['output'];
  purpose?: Maybe<Scalars['String']['output']>;
  requestedServices: Array<ServiceRequestType>;
  tasks: Array<TaskType>;
  team?: Maybe<SelahTeamEnum>;
  userCanEdit: Scalars['Boolean']['output'];
};


export type NoteTypeProvidedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypeRequestedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypeTasksArgs = {
  filters?: InputMaybe<TaskFilter>;
  ordering?: Array<TaskOrder>;
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

export type OrgInvitationInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
};

export enum OrgRoleEnum {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  Superuser = 'SUPERUSER'
}

export type OrganizationFilter = {
  AND?: InputMaybe<OrganizationFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<OrganizationFilter>;
  OR?: InputMaybe<OrganizationFilter>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type OrganizationMemberOrdering = {
  email?: InputMaybe<Ordering>;
  firstName?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  lastLogin?: InputMaybe<Ordering>;
  lastName?: InputMaybe<Ordering>;
  memberRole?: InputMaybe<Ordering>;
};

export type OrganizationMemberType = {
  __typename?: 'OrganizationMemberType';
  email?: Maybe<Scalars['NonBlankString']['output']>;
  firstName?: Maybe<Scalars['NonBlankString']['output']>;
  id: Scalars['ID']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastName?: Maybe<Scalars['NonBlankString']['output']>;
  memberRole: OrgRoleEnum;
  middleName?: Maybe<Scalars['NonBlankString']['output']>;
};

export type OrganizationMemberTypeOffsetPaginated = {
  __typename?: 'OrganizationMemberTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<OrganizationMemberType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type OrganizationOrder = {
  id?: InputMaybe<Ordering>;
  name?: InputMaybe<Ordering>;
};

export type OrganizationServiceCategoryOrdering = {
  id?: InputMaybe<Ordering>;
  priority?: InputMaybe<Ordering>;
};

export type OrganizationServiceCategoryType = {
  __typename?: 'OrganizationServiceCategoryType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
  services: Array<OrganizationServiceType>;
};


export type OrganizationServiceCategoryTypeServicesArgs = {
  ordering?: Array<OrganizationServiceOrdering>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type OrganizationServiceCategoryTypeOffsetPaginated = {
  __typename?: 'OrganizationServiceCategoryTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<OrganizationServiceCategoryType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type OrganizationServiceOrdering = {
  id?: InputMaybe<Ordering>;
  priority?: InputMaybe<Ordering>;
};

export type OrganizationServiceType = {
  __typename?: 'OrganizationServiceType';
  category?: Maybe<OrganizationServiceCategoryType>;
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
};

export type OrganizationServiceTypeOffsetPaginated = {
  __typename?: 'OrganizationServiceTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<OrganizationServiceType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type OrganizationType = {
  __typename?: 'OrganizationType';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type OrganizationTypeOffsetPaginated = {
  __typename?: 'OrganizationTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<OrganizationType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
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
  PetArea = 'PET_AREA',
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

export type ProgramEnrollmentType = {
  __typename?: 'ProgramEnrollmentType';
  clientId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  refClientProgram: Scalars['String']['output'];
};

export enum PronounEnum {
  HeHimHis = 'HE_HIM_HIS',
  Other = 'OTHER',
  SheHerHers = 'SHE_HER_HERS',
  TheyThemTheirs = 'THEY_THEM_THEIRS'
}

export type Query = {
  __typename?: 'Query';
  adminShelters: ShelterTypeOffsetPaginated;
  bulkClientProfileImportRecords: ClientProfileImportRecordTypeOffsetPaginated;
  caseworkerOrganizations: OrganizationTypeOffsetPaginated;
  clientContact: ClientContactType;
  clientContacts: ClientContactTypeOffsetPaginated;
  clientDocument: ClientDocumentType;
  clientDocuments: ClientDocumentTypeOffsetPaginated;
  clientHouseholdMember: ClientHouseholdMemberType;
  clientHouseholdMembers: ClientHouseholdMemberTypeOffsetPaginated;
  clientProfile: ClientProfileType;
  clientProfiles: ClientProfileTypeOffsetPaginated;
  currentUser: CurrentUserType;
  featureControls: FeatureControlData;
  hmisClientProfile: HmisClientProfileType;
  hmisClientProfiles: HmisClientProfileTypeOffsetPaginated;
  hmisClientPrograms: Array<HmisClientProgramType>;
  hmisNote: HmisNoteType;
  hmisNotes: HmisNoteTypeOffsetPaginated;
  hmisProfile: HmisProfileType;
  hmisProfiles: HmisProfileTypeOffsetPaginated;
  interactionAuthors: InteractionAuthorTypeOffsetPaginated;
  note: NoteType;
  notes: NoteTypeOffsetPaginated;
  organizationMember: OrganizationMemberType;
  organizationMembers: OrganizationMemberTypeOffsetPaginated;
  serviceCategories: OrganizationServiceCategoryTypeOffsetPaginated;
  services: OrganizationServiceTypeOffsetPaginated;
  shelter: ShelterType;
  shelters: ShelterTypeOffsetPaginated;
  socialMediaProfile: SocialMediaProfileType;
  socialMediaProfiles: SocialMediaProfileTypeOffsetPaginated;
  task: TaskType;
  tasks: TaskTypeOffsetPaginated;
};


export type QueryAdminSheltersArgs = {
  filters?: InputMaybe<ShelterFilter>;
  ordering?: Array<ShelterOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryBulkClientProfileImportRecordsArgs = {
  data: ClientProfileImportRecordsBulkInput;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryCaseworkerOrganizationsArgs = {
  filters?: InputMaybe<OrganizationFilter>;
  ordering?: InputMaybe<Array<OrganizationOrder>>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientContactArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientContactsArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientDocumentArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientDocumentsArgs = {
  clientId: Scalars['String']['input'];
  filters?: InputMaybe<ClientDocumentFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientHouseholdMemberArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientHouseholdMembersArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryClientProfileArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientProfilesArgs = {
  filters?: InputMaybe<ClientProfileFilter>;
  ordering?: Array<ClientProfileOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryHmisClientProfileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHmisClientProfilesArgs = {
  filters?: InputMaybe<HmisClientProfileFilter>;
  ordering?: Array<HmisClientProfileOrdering>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryHmisClientProgramsArgs = {
  clientId: Scalars['ID']['input'];
};


export type QueryHmisNoteArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHmisNotesArgs = {
  filters?: InputMaybe<HmisNoteFilter>;
  ordering?: Array<HmisNoteOrdering>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryHmisProfileArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryHmisProfilesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryInteractionAuthorsArgs = {
  filters?: InputMaybe<InteractionAuthorFilter>;
  ordering?: Array<InteractionAuthorOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryNoteArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryNotesArgs = {
  filters?: InputMaybe<NoteFilter>;
  ordering?: Array<NoteOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryOrganizationMemberArgs = {
  organizationId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};


export type QueryOrganizationMembersArgs = {
  ordering?: InputMaybe<Array<OrganizationMemberOrdering>>;
  organizationId: Scalars['String']['input'];
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryServiceCategoriesArgs = {
  ordering?: Array<OrganizationServiceCategoryOrdering>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryServicesArgs = {
  ordering?: Array<OrganizationServiceOrdering>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryShelterArgs = {
  pk: Scalars['ID']['input'];
};


export type QuerySheltersArgs = {
  filters?: InputMaybe<ShelterFilter>;
  ordering?: InputMaybe<Array<ShelterOrder>>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QuerySocialMediaProfileArgs = {
  pk: Scalars['ID']['input'];
};


export type QuerySocialMediaProfilesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryTaskArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  filters?: InputMaybe<TaskFilter>;
  ordering?: InputMaybe<Array<TaskOrder>>;
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

export type RemoveHmisNoteServiceRequestInput = {
  hmisNoteId: Scalars['ID']['input'];
  serviceRequestId: Scalars['ID']['input'];
  serviceRequestType: ServiceRequestTypeEnum;
};

export type RemoveHmisNoteServiceRequestPayload = HmisNoteType | OperationInfo;

export type RemoveNoteServiceRequestInput = {
  noteId: Scalars['ID']['input'];
  serviceRequestId: Scalars['ID']['input'];
  serviceRequestType: ServiceRequestTypeEnum;
};

export type RemoveNoteServiceRequestPayload = NoteType | OperationInfo;

export type RemoveOrganizationMemberInput = {
  id: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
};

export type RemoveOrganizationMemberPayload = DeletedObjectType | OperationInfo;

export type RevertNoteInput = {
  id: Scalars['ID']['input'];
  revertBeforeTimestamp: Scalars['DateTime']['input'];
};

export type RevertNotePayload = NoteType | OperationInfo;

export enum RoomStyleChoices {
  Congregate = 'CONGREGATE',
  CubicleHighWalls = 'CUBICLE_HIGH_WALLS',
  CubicleLowWalls = 'CUBICLE_LOW_WALLS',
  HighBunk = 'HIGH_BUNK',
  LowBunk = 'LOW_BUNK',
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

export enum ServiceRequestStatusEnum {
  Completed = 'COMPLETED',
  ToDo = 'TO_DO'
}

export type ServiceRequestType = {
  __typename?: 'ServiceRequestType';
  clientProfile?: Maybe<ClientProfileType>;
  completedOn?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  dueBy?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  service?: Maybe<OrganizationServiceType>;
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
  mapBounds?: InputMaybe<MapBoundsInput>;
  organization?: InputMaybe<DjangoModelFilterInput>;
  properties?: InputMaybe<ShelterPropertyInput>;
};

export type ShelterLocationType = {
  __typename?: 'ShelterLocationType';
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  place: Scalars['String']['output'];
};

export type ShelterOrder = {
  createdAt?: InputMaybe<Ordering>;
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
  addNotesShelterDetails?: Maybe<Scalars['String']['output']>;
  addNotesSleepingDetails?: Maybe<Scalars['String']['output']>;
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
  instagram?: Maybe<Scalars['String']['output']>;
  interiorPhotos: Array<ShelterPhotoType>;
  location?: Maybe<ShelterLocationType>;
  maxStay?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  onSiteSecurity?: Maybe<Scalars['Boolean']['output']>;
  operatingHours?: Maybe<Array<Maybe<TimeRange>>>;
  organization?: Maybe<OrganizationType>;
  otherRules?: Maybe<Scalars['String']['output']>;
  otherServices?: Maybe<Scalars['String']['output']>;
  overallRating?: Maybe<Scalars['Int']['output']>;
  parking: Array<ParkingType>;
  pets: Array<PetType>;
  phone?: Maybe<Scalars['PhoneNumber']['output']>;
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
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  platform?: InputMaybe<SocialMediaEnum>;
  platformUserId?: InputMaybe<Scalars['NonBlankString']['input']>;
};

export type SocialMediaProfileType = {
  __typename?: 'SocialMediaProfileType';
  clientProfile: DjangoModelType;
  id?: Maybe<Scalars['ID']['output']>;
  platform: SocialMediaEnum;
  platformUserId: Scalars['NonBlankString']['output'];
};

export type SocialMediaProfileTypeOffsetPaginated = {
  __typename?: 'SocialMediaProfileTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<SocialMediaProfileType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export enum SpecialSituationRestrictionChoices {
  DomesticViolence = 'DOMESTIC_VIOLENCE',
  HarmReduction = 'HARM_REDUCTION',
  HivAids = 'HIV_AIDS',
  HumanTrafficking = 'HUMAN_TRAFFICKING',
  JusticeSystems = 'JUSTICE_SYSTEMS',
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

export type TaskFilter = {
  AND?: InputMaybe<TaskFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<TaskFilter>;
  OR?: InputMaybe<TaskFilter>;
  authors?: InputMaybe<Array<Scalars['ID']['input']>>;
  clientProfile?: InputMaybe<Scalars['ID']['input']>;
  clientProfileLookup?: InputMaybe<IdFilterLookup>;
  clientProfiles?: InputMaybe<Array<Scalars['ID']['input']>>;
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  hmisClientProfile?: InputMaybe<Scalars['ID']['input']>;
  hmisClientProfileLookup?: InputMaybe<IdFilterLookup>;
  hmisClientProfiles?: InputMaybe<Array<Scalars['ID']['input']>>;
  hmisNote?: InputMaybe<IdFilterLookup>;
  note?: InputMaybe<IdFilterLookup>;
  organizations?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<TaskStatusEnum>>;
  teams?: InputMaybe<Array<SelahTeamEnum>>;
};

export type TaskOrder = {
  createdAt?: InputMaybe<Ordering>;
  id?: InputMaybe<Ordering>;
  status?: InputMaybe<Ordering>;
  updatedAt?: InputMaybe<Ordering>;
};

export enum TaskStatusEnum {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  ToDo = 'TO_DO'
}

export type TaskType = {
  __typename?: 'TaskType';
  clientProfile?: Maybe<ClientProfileType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  description?: Maybe<Scalars['String']['output']>;
  hmisClientProfile?: Maybe<HmisClientProfileType>;
  hmisNote?: Maybe<DjangoModelType>;
  id: Scalars['ID']['output'];
  note?: Maybe<DjangoModelType>;
  organization?: Maybe<OrganizationType>;
  status?: Maybe<TaskStatusEnum>;
  summary?: Maybe<Scalars['String']['output']>;
  team?: Maybe<SelahTeamEnum>;
  updatedAt: Scalars['DateTime']['output'];
};

export type TaskTypeOffsetPaginated = {
  __typename?: 'TaskTypeOffsetPaginated';
  pageInfo: OffsetPaginationInfo;
  /** List of paginated results. */
  results: Array<TaskType>;
  /** Total count of existing results. */
  totalCount: Scalars['Int']['output'];
};

export type TimeRange = {
  __typename?: 'TimeRange';
  end?: Maybe<Scalars['DateTime']['output']>;
  start?: Maybe<Scalars['DateTime']['output']>;
};

export enum TrainingServiceChoices {
  JobTraining = 'JOB_TRAINING',
  LifeSkillsTraining = 'LIFE_SKILLS_TRAINING',
  Tutoring = 'TUTORING'
}

export type TrainingServiceType = {
  __typename?: 'TrainingServiceType';
  name?: Maybe<TrainingServiceChoices>;
};

export type UpdateClientContactPayload = ClientContactType | OperationInfo;

export type UpdateClientDocumentInput = {
  id: Scalars['ID']['input'];
  originalFilename?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateClientDocumentPayload = ClientDocumentType | OperationInfo;

export type UpdateClientHouseholdMemberPayload = ClientHouseholdMemberType | OperationInfo;

export type UpdateClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  address?: InputMaybe<Scalars['String']['input']>;
  age?: InputMaybe<Scalars['Int']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<ClientContactInput>>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['NonBlankString']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  firstName?: InputMaybe<Scalars['NonBlankString']['input']>;
  gender?: InputMaybe<GenderEnum>;
  genderOther?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  hmisProfiles?: InputMaybe<Array<HmisProfileInput>>;
  householdMembers?: InputMaybe<Array<ClientHouseholdMemberInput>>;
  id: Scalars['ID']['input'];
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['NonBlankString']['input']>;
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  middleName?: InputMaybe<Scalars['NonBlankString']['input']>;
  nickname?: InputMaybe<Scalars['NonBlankString']['input']>;
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
  residenceGeolocation?: InputMaybe<Scalars['Point']['input']>;
  socialMediaProfiles?: InputMaybe<Array<SocialMediaProfileInput>>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  veteranStatus?: InputMaybe<VeteranStatusEnum>;
};

export type UpdateClientProfilePayload = ClientProfileType | OperationInfo;

export type UpdateClientProfilePhotoPayload = ClientProfileType | OperationInfo;

export type UpdateCurrentUserPayload = CurrentUserType | OperationInfo | UserType;

export type UpdateHmisClientProfileInput = {
  adaAccommodation?: InputMaybe<Array<AdaAccommodationEnum>>;
  additionalRaceEthnicityDetail?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  alias?: InputMaybe<Scalars['String']['input']>;
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  californiaId?: InputMaybe<Scalars['String']['input']>;
  dobQuality?: InputMaybe<HmisDobQualityEnum>;
  email?: InputMaybe<Scalars['NonBlankString']['input']>;
  eyeColor?: InputMaybe<EyeColorEnum>;
  firstName?: InputMaybe<Scalars['NonBlankString']['input']>;
  gender: Array<HmisGenderEnum>;
  genderIdentityText?: InputMaybe<Scalars['String']['input']>;
  hairColor?: InputMaybe<HairColorEnum>;
  heightInInches?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['ID']['input'];
  importantNotes?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['NonBlankString']['input']>;
  livingSituation?: InputMaybe<LivingSituationEnum>;
  mailingAddress?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatusEnum>;
  nameMiddle?: InputMaybe<Scalars['NonBlankString']['input']>;
  nameQuality?: InputMaybe<HmisNameQualityEnum>;
  nameSuffix?: InputMaybe<HmisSuffixEnum>;
  phoneNumbers?: InputMaybe<Array<PhoneNumberInput>>;
  physicalDescription?: InputMaybe<Scalars['String']['input']>;
  placeOfBirth?: InputMaybe<Scalars['String']['input']>;
  preferredCommunication?: InputMaybe<Array<PreferredCommunicationEnum>>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  profilePhoto?: InputMaybe<Scalars['Upload']['input']>;
  pronouns?: InputMaybe<PronounEnum>;
  pronounsOther?: InputMaybe<Scalars['String']['input']>;
  raceEthnicity: Array<HmisRaceEnum>;
  residenceAddress?: InputMaybe<Scalars['String']['input']>;
  residenceGeolocation?: InputMaybe<Scalars['Point']['input']>;
  spokenLanguages?: InputMaybe<Array<LanguageEnum>>;
  ssn1?: InputMaybe<Scalars['String']['input']>;
  ssn2?: InputMaybe<Scalars['String']['input']>;
  ssn3?: InputMaybe<Scalars['String']['input']>;
  ssnQuality?: InputMaybe<HmisSsnQualityEnum>;
  veteran?: InputMaybe<HmisVeteranStatusEnum>;
};

export type UpdateHmisClientProfilePayload = HmisClientProfileType | OperationInfo;

export type UpdateHmisNoteInput = {
  date?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  refClientProgram?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHmisNoteLocationInput = {
  id: Scalars['ID']['input'];
  location: LocationInput;
};

export type UpdateHmisNoteLocationPayload = HmisNoteType | OperationInfo;

export type UpdateHmisNotePayload = HmisNoteType | OperationInfo;

export type UpdateHmisProfilePayload = HmisProfileType | OperationInfo;

export type UpdateNoteInput = {
  id: Scalars['ID']['input'];
  interactedAt?: InputMaybe<Scalars['DateTime']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['ID']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['NonBlankString']['input']>;
  team?: InputMaybe<SelahTeamEnum>;
};

export type UpdateNoteLocationInput = {
  id: Scalars['ID']['input'];
  location: LocationInput;
};

export type UpdateNoteLocationPayload = NoteType | OperationInfo;

export type UpdateNotePayload = NoteType | OperationInfo;

export type UpdateServiceRequestInput = {
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  serviceOther?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ServiceRequestStatusEnum>;
};

export type UpdateServiceRequestPayload = OperationInfo | ServiceRequestType;

export type UpdateSocialMediaProfilePayload = OperationInfo | SocialMediaProfileType;

export type UpdateTaskInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatusEnum>;
  summary?: InputMaybe<Scalars['String']['input']>;
  team?: InputMaybe<SelahTeamEnum>;
};

export type UpdateTaskPayload = OperationInfo | TaskType;

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['NonBlankString']['input']>;
  firstName?: InputMaybe<Scalars['NonBlankString']['input']>;
  hasAcceptedPrivacyPolicy?: InputMaybe<Scalars['Boolean']['input']>;
  hasAcceptedTos?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['NonBlankString']['input']>;
  middleName?: InputMaybe<Scalars['NonBlankString']['input']>;
};

export enum UserOrganizationPermissions {
  AccessOrgPortal = 'ACCESS_ORG_PORTAL',
  AddOrgMember = 'ADD_ORG_MEMBER',
  ChangeOrgMemberRole = 'CHANGE_ORG_MEMBER_ROLE',
  RemoveOrgMember = 'REMOVE_ORG_MEMBER',
  ViewOrgMembers = 'VIEW_ORG_MEMBERS'
}

export type UserType = {
  __typename?: 'UserType';
  email?: Maybe<Scalars['NonBlankString']['output']>;
  firstName?: Maybe<Scalars['NonBlankString']['output']>;
  hasAcceptedPrivacyPolicy?: Maybe<Scalars['Boolean']['output']>;
  hasAcceptedTos?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  isHmisUser?: Maybe<Scalars['Boolean']['output']>;
  isOutreachAuthorized?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['NonBlankString']['output']>;
  middleName?: Maybe<Scalars['NonBlankString']['output']>;
  organizationsOrganization?: Maybe<Array<OrganizationType>>;
  username?: Maybe<Scalars['String']['output']>;
};


export type UserTypeOrganizationsOrganizationArgs = {
  filters?: InputMaybe<OrganizationFilter>;
  ordering?: Array<OrganizationOrder>;
};

export enum VeteranStatusEnum {
  No = 'NO',
  OtherThanHonorable = 'OTHER_THAN_HONORABLE',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
  Yes = 'YES'
}
