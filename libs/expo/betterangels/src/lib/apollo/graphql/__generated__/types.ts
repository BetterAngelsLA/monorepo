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
  Upload: { input: any; output: any; }
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
  namespace: ClientDocumentNamespaceEnum;
  originalFilename?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
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

export type ClientProfileFilter = {
  AND?: InputMaybe<ClientProfileFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ClientProfileFilter>;
  OR?: InputMaybe<ClientProfileFilter>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  searchClient?: InputMaybe<ClientSearchInput>;
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
  hmisId?: Maybe<Scalars['String']['output']>;
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
  veteranStatus?: Maybe<YesNoPreferNotToSayEnum>;
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

export type ClientSearchInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateClientDocumentInput = {
  clientProfile: Scalars['ID']['input'];
  file: Scalars['Upload']['input'];
  namespace: ClientDocumentNamespaceEnum;
};

export type CreateClientDocumentPayload = ClientDocumentType | OperationInfo;

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
  hmisId?: InputMaybe<Scalars['String']['input']>;
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
  veteranStatus?: InputMaybe<YesNoPreferNotToSayEnum>;
};

export type CreateClientProfilePayload = ClientProfileType | OperationInfo;

export type CreateNoteAttachmentInput = {
  file: Scalars['Upload']['input'];
  namespace: NoteNamespaceEnum;
  note: Scalars['ID']['input'];
};

export type CreateNoteAttachmentPayload = NoteAttachmentType | OperationInfo;

export type CreateNoteInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  purpose?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateNoteMoodInput = {
  descriptor: MoodEnum;
  noteId: Scalars['ID']['input'];
};

export type CreateNoteMoodPayload = MoodType | OperationInfo;

export type CreateNotePayload = NoteType | OperationInfo;

export type CreateNoteServiceRequestInput = {
  customService?: InputMaybe<Scalars['String']['input']>;
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

export type CreateServiceRequestInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  customService?: InputMaybe<Scalars['String']['input']>;
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

export type DeleteNoteAttachmentPayload = NoteAttachmentType | OperationInfo;

export type DeleteNotePayload = NoteType | OperationInfo;

export type DeleteServiceRequestPayload = DeletedObjectType | OperationInfo;

export type DeleteTaskPayload = DeletedObjectType | OperationInfo;

export type DeletedObjectType = {
  __typename?: 'DeletedObjectType';
  id: Scalars['Int']['output'];
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

export enum GenderEnum {
  Female = 'FEMALE',
  Male = 'MALE',
  NonBinary = 'NON_BINARY',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY'
}

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

export enum HmisAgencyEnum {
  Champ = 'CHAMP',
  Lahsa = 'LAHSA',
  Pasadena = 'PASADENA',
  SantaMonica = 'SANTA_MONICA',
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

export enum LanguageEnum {
  Arabic = 'ARABIC',
  Armenian = 'ARMENIAN',
  English = 'ENGLISH',
  Farsi = 'FARSI',
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
  createNote: CreateNotePayload;
  createNoteAttachment: CreateNoteAttachmentPayload;
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
  deleteNoteAttachment: DeleteNoteAttachmentPayload;
  deleteServiceRequest: DeleteServiceRequestPayload;
  deleteTask: DeleteTaskPayload;
  generateMagicLink: MagicLinkResponse;
  googleAuth: AuthResponse;
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


export type MutationCreateNoteArgs = {
  data: CreateNoteInput;
};


export type MutationCreateNoteAttachmentArgs = {
  data: CreateNoteAttachmentInput;
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


export type MutationDeleteNoteAttachmentArgs = {
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

export type NoteAttachmentFilter = {
  AND?: InputMaybe<NoteAttachmentFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<NoteAttachmentFilter>;
  OR?: InputMaybe<NoteAttachmentFilter>;
  attachmentType?: InputMaybe<AttachmentType>;
  namespace: NoteNamespaceEnum;
};

export type NoteAttachmentType = AttachmentInterface & {
  __typename?: 'NoteAttachmentType';
  attachmentType: AttachmentType;
  createdAt: Scalars['DateTime']['output'];
  file: DjangoFileType;
  id: Scalars['ID']['output'];
  namespace: NoteNamespaceEnum;
  originalFilename?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type NoteFilter = {
  AND?: InputMaybe<NoteFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<NoteFilter>;
  OR?: InputMaybe<NoteFilter>;
  client?: InputMaybe<Scalars['ID']['input']>;
  createdBy?: InputMaybe<Scalars['ID']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export enum NoteNamespaceEnum {
  MoodAssessment = 'MOOD_ASSESSMENT',
  ProvidedServices = 'PROVIDED_SERVICES',
  RequestedServices = 'REQUESTED_SERVICES'
}

export type NoteOrder = {
  id?: InputMaybe<Ordering>;
  interactedAt?: InputMaybe<Ordering>;
};

export type NoteType = {
  __typename?: 'NoteType';
  attachments: Array<NoteAttachmentType>;
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
  title?: Maybe<Scalars['String']['output']>;
};


export type NoteTypeAttachmentsArgs = {
  filters?: InputMaybe<NoteAttachmentFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
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

/** Permission definition for schema directives. */
export type PermDefinition = {
  /** The app to which we are requiring permission. If this is empty that means that we are checking the permission directly. */
  app?: InputMaybe<Scalars['String']['input']>;
  /** The permission itself. If this is empty that means that we are checking for any permission for the given app. */
  permission?: InputMaybe<Scalars['String']['input']>;
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
  clientDocument: ClientDocumentType;
  clientDocuments: Array<ClientDocumentType>;
  clientProfile: ClientProfileType;
  clientProfiles: Array<ClientProfileType>;
  currentUser: UserType;
  featureControls: FeatureControlData;
  note: NoteType;
  noteAttachment: NoteAttachmentType;
  noteAttachments: Array<NoteAttachmentType>;
  notes: Array<NoteType>;
  serviceRequest: ServiceRequestType;
  serviceRequests: Array<ServiceRequestType>;
  task: TaskType;
  tasks: Array<TaskType>;
};


export type QueryClientDocumentArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientDocumentsArgs = {
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


export type QueryNoteArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryNoteAttachmentArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryNoteAttachmentsArgs = {
  filters?: InputMaybe<NoteAttachmentFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryNotesArgs = {
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
  Bicycle = 'BICYCLE',
  BirthCertificate = 'BIRTH_CERTIFICATE',
  Blanket = 'BLANKET',
  Book = 'BOOK',
  CaliforniaLifelinePhone = 'CALIFORNIA_LIFELINE_PHONE',
  Clothes = 'CLOTHES',
  ContactDpss = 'CONTACT_DPSS',
  ContactFriend = 'CONTACT_FRIEND',
  Dental = 'DENTAL',
  DiscountScooterRides = 'DISCOUNT_SCOOTER_RIDES',
  DmhEvaluation = 'DMH_EVALUATION',
  DmvNoFeeIdForm = 'DMV_NO_FEE_ID_FORM',
  FamilyReunification = 'FAMILY_REUNIFICATION',
  Food = 'FOOD',
  HarmReduction = 'HARM_REDUCTION',
  HygieneKit = 'HYGIENE_KIT',
  InternetAccess = 'INTERNET_ACCESS',
  LegalCounsel = 'LEGAL_COUNSEL',
  MailPickUp = 'MAIL_PICK_UP',
  Medical = 'MEDICAL',
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
  SocialSecurityCardReplacement = 'SOCIAL_SECURITY_CARD_REPLACEMENT',
  Stabilize = 'STABILIZE',
  StimulusAssistance = 'STIMULUS_ASSISTANCE',
  Storage = 'STORAGE',
  StorageBelongings = 'STORAGE_BELONGINGS',
  StorageDocuments = 'STORAGE_DOCUMENTS',
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
  customService?: Maybe<Scalars['String']['output']>;
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
  hmisId?: InputMaybe<Scalars['String']['input']>;
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
  veteranStatus?: InputMaybe<YesNoPreferNotToSayEnum>;
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
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNoteLocationInput = {
  id: Scalars['ID']['input'];
  location: LocationInput;
};

export type UpdateNoteLocationPayload = NoteType | OperationInfo;

export type UpdateNotePayload = NoteType | OperationInfo;

export type UpdateServiceRequestInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  customService?: InputMaybe<Scalars['String']['input']>;
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

export enum YesNoPreferNotToSayEnum {
  No = 'NO',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
  Yes = 'YES'
}
