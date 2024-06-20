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
  /** Decimal (fixed-point) */
  Decimal: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: any; output: any; }
  /** Represents a point as `(x, y, z)` or `(x, y)`. */
  Point: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

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
  file: DjangoFileType;
  id: Scalars['ID']['output'];
  originalFilename?: Maybe<Scalars['String']['output']>;
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

export type BedsType = {
  __typename?: 'BedsType';
  availableBeds?: Maybe<Scalars['Int']['output']>;
  averageBedRate?: Maybe<Scalars['Decimal']['output']>;
  bedLayoutDescription?: Maybe<Scalars['String']['output']>;
  maxStay?: Maybe<Scalars['Int']['output']>;
  privateBeds?: Maybe<Scalars['Int']['output']>;
  totalBeds?: Maybe<Scalars['Int']['output']>;
};

export type ClientProfileFilter = {
  AND?: InputMaybe<ClientProfileFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ClientProfileFilter>;
  OR?: InputMaybe<ClientProfileFilter>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ClientProfileOrder = {
  user_FirstName?: InputMaybe<Ordering>;
  user_LastName?: InputMaybe<Ordering>;
};

export type ClientProfileType = {
  __typename?: 'ClientProfileType';
  address?: Maybe<Scalars['String']['output']>;
  age?: Maybe<Scalars['Int']['output']>;
  dateOfBirth?: Maybe<Scalars['Date']['output']>;
  gender?: Maybe<GenderEnum>;
  hmisId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  nickname?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  preferredLanguage?: Maybe<LanguageEnum>;
  pronouns?: Maybe<Scalars['String']['output']>;
  spokenLanguages?: Maybe<Array<Maybe<LanguageEnum>>>;
  user: UserType;
  veteranStatus?: Maybe<YesNoPreferNotToSayEnum>;
};

export type CreateClientProfileInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  gender?: InputMaybe<GenderEnum>;
  hmisId?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  pronouns?: InputMaybe<Scalars['String']['input']>;
  spokenLanguages?: InputMaybe<Array<InputMaybe<LanguageEnum>>>;
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
  title: Scalars['String']['input'];
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
};

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

export type DescriptionType = {
  __typename?: 'DescriptionType';
  description?: Maybe<Scalars['String']['output']>;
  typicalStayDescription?: Maybe<Scalars['String']['output']>;
};

export type DjangoFileType = {
  __typename?: 'DjangoFileType';
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  url: Scalars['String']['output'];
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
  Nonbinary = 'NONBINARY'
}

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
  createClientProfile: CreateClientProfilePayload;
  createNote: CreateNotePayload;
  createNoteAttachment: CreateNoteAttachmentPayload;
  createNoteMood: CreateNoteMoodPayload;
  createNoteServiceRequest: CreateNoteServiceRequestPayload;
  createNoteTask: CreateNoteTaskPayload;
  createServiceRequest: CreateServiceRequestPayload;
  createTask: CreateTaskPayload;
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
  file: DjangoFileType;
  id: Scalars['ID']['output'];
  namespace: NoteNamespaceEnum;
  originalFilename?: Maybe<Scalars['String']['output']>;
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
  purposes: Array<TaskType>;
  requestedServices: Array<ServiceRequestType>;
  title: Scalars['String']['output'];
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
  limit?: Scalars['Int']['input'];
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

export type Query = {
  __typename?: 'Query';
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
  shelter: ShelterType;
  shelters: Array<ShelterType>;
  task: TaskType;
  tasks: Array<TaskType>;
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


export type QueryShelterArgs = {
  pk: Scalars['ID']['input'];
};


export type QuerySheltersArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type QueryTaskArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  order?: InputMaybe<TaskOrder>;
  pagination?: InputMaybe<OffsetPaginationInput>;
};

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
  id?: InputMaybe<Scalars['ID']['input']>;
  revertBeforeTimestamp: Scalars['DateTime']['input'];
};

export type RevertNotePayload = NoteType | OperationInfo;

export type SampleType = {
  __typename?: 'SampleType';
  isActive: Scalars['Boolean']['output'];
  lastModified?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
};

export enum ServiceEnum {
  Blanket = 'BLANKET',
  Book = 'BOOK',
  Clothes = 'CLOTHES',
  Dental = 'DENTAL',
  Food = 'FOOD',
  HarmReduction = 'HARM_REDUCTION',
  HygieneKit = 'HYGIENE_KIT',
  Medical = 'MEDICAL',
  Other = 'OTHER',
  PetCare = 'PET_CARE',
  PetFood = 'PET_FOOD',
  Shelter = 'SHELTER',
  Shoes = 'SHOES',
  Shower = 'SHOWER',
  Stabilize = 'STABILIZE',
  Storage = 'STORAGE',
  Transport = 'TRANSPORT',
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
  status: ServiceRequestStatusEnum;
};

export enum ServiceRequestTypeEnum {
  Provided = 'PROVIDED',
  Requested = 'REQUESTED'
}

export type ShelterLocationType = {
  __typename?: 'ShelterLocationType';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  confidential?: Maybe<Scalars['Boolean']['output']>;
  point?: Maybe<Scalars['Point']['output']>;
  spa?: Maybe<Scalars['Int']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type ShelterType = {
  __typename?: 'ShelterType';
  beds: BedsType;
  description: DescriptionType;
  email?: Maybe<Scalars['String']['output']>;
  funders: Array<Scalars['String']['output']>;
  howToEnter: Array<DjangoModelType>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  location: ShelterLocationType;
  organization: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  populations: Array<Scalars['String']['output']>;
  requirements: Array<Scalars['String']['output']>;
  services: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type SwitchType = {
  __typename?: 'SwitchType';
  isActive: Scalars['Boolean']['output'];
  lastModified?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
};

export type TaskOrder = {
  dueBy?: InputMaybe<Ordering>;
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
  address?: InputMaybe<Scalars['String']['input']>;
  dateOfBirth?: InputMaybe<Scalars['Date']['input']>;
  gender?: InputMaybe<GenderEnum>;
  hmisId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<LanguageEnum>;
  pronouns?: InputMaybe<Scalars['String']['input']>;
  spokenLanguages?: InputMaybe<Array<InputMaybe<LanguageEnum>>>;
  veteranStatus?: InputMaybe<YesNoPreferNotToSayEnum>;
};

export type UpdateClientProfilePayload = ClientProfileType | OperationInfo;

export type UpdateNoteInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  interactedAt?: InputMaybe<Scalars['DateTime']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['ID']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNoteLocationInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  location: LocationInput;
};

export type UpdateNoteLocationPayload = NoteType | OperationInfo;

export type UpdateNotePayload = NoteType | OperationInfo;

export type UpdateServiceRequestInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  customService?: InputMaybe<Scalars['String']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<ServiceRequestStatusEnum>;
};

export type UpdateServiceRequestPayload = OperationInfo | ServiceRequestType;

export type UpdateTaskInput = {
  client?: InputMaybe<Scalars['ID']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  location?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<TaskStatusEnum>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskLocationInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  location: LocationInput;
};

export type UpdateTaskLocationPayload = OperationInfo | TaskType;

export type UpdateTaskPayload = OperationInfo | TaskType;

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isOutreachAuthorized: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  organizationsOrganization: Array<OrganizationType>;
  username: Scalars['String']['output'];
};

export enum YesNoPreferNotToSayEnum {
  No = 'NO',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
  Yes = 'YES'
}
