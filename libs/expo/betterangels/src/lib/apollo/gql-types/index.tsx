import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date with time (isoformat) */
  DateTime: { input: any; output: any; }
  /** Decimal (fixed-point) */
  Decimal: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
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

export type BedsType = {
  __typename?: 'BedsType';
  availableBeds?: Maybe<Scalars['Int']['output']>;
  averageBedRate?: Maybe<Scalars['Decimal']['output']>;
  bedLayoutDescription?: Maybe<Scalars['String']['output']>;
  maxStay?: Maybe<Scalars['Int']['output']>;
  privateBeds?: Maybe<Scalars['Int']['output']>;
  totalBeds?: Maybe<Scalars['Int']['output']>;
};

export type ClientFilter = {
  AND?: InputMaybe<ClientFilter>;
  DISTINCT?: InputMaybe<Scalars['Boolean']['input']>;
  NOT?: InputMaybe<ClientFilter>;
  OR?: InputMaybe<ClientFilter>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ClientProfileInput = {
  hmisId?: InputMaybe<Scalars['String']['input']>;
};

export type ClientProfileType = {
  __typename?: 'ClientProfileType';
  hmisId?: Maybe<Scalars['String']['output']>;
};

export type ClientType = {
  __typename?: 'ClientType';
  clientProfile: ClientProfileType;
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};

export type CreateClientInput = {
  clientProfile?: InputMaybe<ClientProfileInput>;
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateClientPayload = ClientType | OperationInfo;

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

export type DeleteDjangoObjectInput = {
  id: Scalars['ID']['input'];
};

export type DeleteMoodPayload = DeletedObjectType | OperationInfo;

export type DeleteNoteAttachmentPayload = NoteAttachmentType | OperationInfo;

export type DeleteNotePayload = NoteType | OperationInfo;

export type DeleteServiceRequestPayload = OperationInfo | ServiceRequestType;

export type DeleteTaskPayload = OperationInfo | TaskType;

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

export type DjangoModelFilterInput = {
  pk: Scalars['ID']['input'];
};

export type DjangoModelType = {
  __typename?: 'DjangoModelType';
  pk: Scalars['ID']['output'];
};

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

export type GetOrCreateAddressPayload = AddressType | OperationInfo;

export type LocationType = {
  __typename?: 'LocationType';
  address?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  confidential?: Maybe<Scalars['Boolean']['output']>;
  point?: Maybe<Scalars['Point']['output']>;
  spa?: Maybe<Scalars['Int']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
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
  createClient: CreateClientPayload;
  createNote: CreateNotePayload;
  createNoteAttachment: CreateNoteAttachmentPayload;
  createNoteMood: CreateNoteMoodPayload;
  createNoteServiceRequest: CreateNoteServiceRequestPayload;
  createNoteTask: CreateNoteTaskPayload;
  createServiceRequest: CreateServiceRequestPayload;
  createTask: CreateTaskPayload;
  deleteMood: DeleteMoodPayload;
  deleteNote: DeleteNotePayload;
  deleteNoteAttachment: DeleteNoteAttachmentPayload;
  deleteServiceRequest: DeleteServiceRequestPayload;
  deleteTask: DeleteTaskPayload;
  generateMagicLink: MagicLinkResponse;
  getOrCreateAddress: GetOrCreateAddressPayload;
  logout: Scalars['Boolean']['output'];
  removeNoteServiceRequest: RemoveNoteServiceRequestPayload;
  removeNoteTask: RemoveNoteTaskPayload;
  revertNote: RevertNotePayload;
  updateNote: UpdateNotePayload;
  updateNoteLocation: UpdateNoteLocationPayload;
  updateServiceRequest: UpdateServiceRequestPayload;
  updateTask: UpdateTaskPayload;
  updateTaskLocation: UpdateTaskLocationPayload;
};


export type MutationAddNoteTaskArgs = {
  data: AddNoteTaskInput;
};


export type MutationCreateClientArgs = {
  data: CreateClientInput;
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


export type MutationGetOrCreateAddressArgs = {
  data: AddressInput;
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
  client?: InputMaybe<DjangoModelFilterInput>;
  createdBy?: InputMaybe<DjangoModelFilterInput>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum NoteNamespaceEnum {
  MoodAssessment = 'MOOD_ASSESSMENT',
  ProvidedServices = 'PROVIDED_SERVICES',
  RequestedServices = 'REQUESTED_SERVICES'
}

export type NoteType = {
  __typename?: 'NoteType';
  address?: Maybe<AddressType>;
  attachments: Array<NoteAttachmentType>;
  client?: Maybe<UserType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  id: Scalars['ID']['output'];
  interactedAt: Scalars['DateTime']['output'];
  isSubmitted: Scalars['Boolean']['output'];
  moods: Array<MoodType>;
  nextSteps: Array<TaskType>;
  point?: Maybe<Scalars['Point']['output']>;
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
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypeProvidedServicesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};


export type NoteTypePurposesArgs = {
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

/** Permission definition for schema directives. */
export type PermDefinition = {
  /** The app to which we are requiring permission. If this is empty that means that we are checking the permission directly. */
  app?: InputMaybe<Scalars['String']['input']>;
  /** The permission itself. If this is empty that means that we are checking for any permission for the given app. */
  permission?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  address: AddressType;
  addresses: Array<AddressType>;
  client: ClientType;
  clients: Array<ClientType>;
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


export type QueryAddressArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryClientsArgs = {
  filters?: InputMaybe<ClientFilter>;
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
  savedAt: Scalars['DateTime']['input'];
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

export type ShelterType = {
  __typename?: 'ShelterType';
  beds: BedsType;
  description: DescriptionType;
  email?: Maybe<Scalars['String']['output']>;
  funders: Array<Scalars['String']['output']>;
  howToEnter: Array<DjangoModelType>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  location: LocationType;
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

export enum TaskStatusEnum {
  Completed = 'COMPLETED',
  ToDo = 'TO_DO'
}

export type TaskType = {
  __typename?: 'TaskType';
  address?: Maybe<AddressType>;
  client?: Maybe<UserType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  dueBy?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  point?: Maybe<Scalars['Point']['output']>;
  status: TaskStatusEnum;
  title: Scalars['String']['output'];
};

export enum TaskTypeEnum {
  NextStep = 'NEXT_STEP',
  Purpose = 'PURPOSE'
}

export type UpdateNoteInput = {
  address?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  interactedAt?: InputMaybe<Scalars['DateTime']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  point?: InputMaybe<Scalars['Point']['input']>;
  privateDetails?: InputMaybe<Scalars['String']['input']>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNoteLocationInput = {
  address: AddressInput;
  id?: InputMaybe<Scalars['ID']['input']>;
  point?: InputMaybe<Scalars['Point']['input']>;
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
  address?: InputMaybe<Scalars['ID']['input']>;
  client?: InputMaybe<Scalars['ID']['input']>;
  dueBy?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  point?: InputMaybe<Scalars['Point']['input']>;
  status?: InputMaybe<TaskStatusEnum>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskLocationInput = {
  address: AddressInput;
  id?: InputMaybe<Scalars['ID']['input']>;
  point?: InputMaybe<Scalars['Point']['input']>;
};

export type UpdateTaskLocationPayload = OperationInfo | TaskType;

export type UpdateTaskPayload = OperationInfo | TaskType;

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};

export type GenerateMagicLinkMutationVariables = Exact<{ [key: string]: never; }>;


export type GenerateMagicLinkMutation = { __typename?: 'Mutation', generateMagicLink: { __typename?: 'MagicLinkResponse', message: string } };

export type CreateNoteMutationVariables = Exact<{
  data: CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type UpdateNoteMutationVariables = Exact<{
  data: UpdateNoteInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type DeleteNoteMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: { __typename?: 'NoteType', id: string } | { __typename?: 'OperationInfo' } };

export type CreateNoteServiceRequestMutationVariables = Exact<{
  data: CreateNoteServiceRequestInput;
}>;


export type CreateNoteServiceRequestMutation = { __typename?: 'Mutation', createNoteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string, service: ServiceEnum } };

export type DeleteServiceRequestMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteServiceRequestMutation = { __typename?: 'Mutation', deleteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string } };

export type CreateNoteMoodMutationVariables = Exact<{
  data: CreateNoteMoodInput;
}>;


export type CreateNoteMoodMutation = { __typename?: 'Mutation', createNoteMood: { __typename?: 'MoodType', id: string, descriptor: MoodEnum } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteMoodMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteMoodMutation = { __typename?: 'Mutation', deleteMood: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type CreateNoteTaskMutationVariables = Exact<{
  data: CreateNoteTaskInput;
}>;


export type CreateNoteTaskMutation = { __typename?: 'Mutation', createNoteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type UpdateTaskMutationVariables = Exact<{
  data: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string } };

export type CreateNoteAttachmentMutationVariables = Exact<{
  noteId: Scalars['ID']['input'];
  namespace: NoteNamespaceEnum;
  file: Scalars['Upload']['input'];
}>;


export type CreateNoteAttachmentMutation = { __typename?: 'Mutation', createNoteAttachment: { __typename?: 'NoteAttachmentType', id: string, attachmentType: AttachmentType, originalFilename?: string | null, namespace: NoteNamespaceEnum, file: { __typename?: 'DjangoFileType', name: string } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteNoteAttachmentMutationVariables = Exact<{
  attachmentId: Scalars['ID']['input'];
}>;


export type DeleteNoteAttachmentMutation = { __typename?: 'Mutation', deleteNoteAttachment: { __typename?: 'NoteAttachmentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type UpdateNoteLocationMutationVariables = Exact<{
  data: UpdateNoteLocationInput;
}>;


export type UpdateNoteLocationMutation = { __typename?: 'Mutation', updateNoteLocation: { __typename?: 'NoteType', id: string, point?: any | null, address?: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, email: string } };

export type NotesQueryVariables = Exact<{
  filters?: InputMaybe<NoteFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, address?: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string, email: string, username: string } | null, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }> };

export type ViewNoteQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, createdAt: any, address?: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, attachments: Array<{ __typename?: 'NoteAttachmentType', id: string, namespace: NoteNamespaceEnum, attachmentType: AttachmentType, file: { __typename?: 'DjangoFileType', path: string, url: string, name: string, size: number } }>, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, createdAt: any, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };


export const GenerateMagicLinkDocument = gql`
    mutation GenerateMagicLink {
  generateMagicLink(data: {email: "paul+test@betterangels.la"}) {
    message
  }
}
    `;
export type GenerateMagicLinkMutationFn = Apollo.MutationFunction<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>;

/**
 * __useGenerateMagicLinkMutation__
 *
 * To run a mutation, you first call `useGenerateMagicLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateMagicLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateMagicLinkMutation, { data, loading, error }] = useGenerateMagicLinkMutation({
 *   variables: {
 *   },
 * });
 */
export function useGenerateMagicLinkMutation(baseOptions?: Apollo.MutationHookOptions<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>(GenerateMagicLinkDocument, options);
      }
export type GenerateMagicLinkMutationHookResult = ReturnType<typeof useGenerateMagicLinkMutation>;
export type GenerateMagicLinkMutationResult = Apollo.MutationResult<GenerateMagicLinkMutation>;
export type GenerateMagicLinkMutationOptions = Apollo.BaseMutationOptions<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>;
export const CreateNoteDocument = gql`
    mutation CreateNote($data: CreateNoteInput!) {
  createNote(data: $data) {
    ... on NoteType {
      id
      title
      publicDetails
      client {
        id
        username
        firstName
        lastName
        email
      }
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
}
    `;
export type CreateNoteMutationFn = Apollo.MutationFunction<CreateNoteMutation, CreateNoteMutationVariables>;

/**
 * __useCreateNoteMutation__
 *
 * To run a mutation, you first call `useCreateNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteMutation, { data, loading, error }] = useCreateNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteMutation, CreateNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteMutation, CreateNoteMutationVariables>(CreateNoteDocument, options);
      }
export type CreateNoteMutationHookResult = ReturnType<typeof useCreateNoteMutation>;
export type CreateNoteMutationResult = Apollo.MutationResult<CreateNoteMutation>;
export type CreateNoteMutationOptions = Apollo.BaseMutationOptions<CreateNoteMutation, CreateNoteMutationVariables>;
export const UpdateNoteDocument = gql`
    mutation UpdateNote($data: UpdateNoteInput!) {
  updateNote(data: $data) {
    ... on NoteType {
      id
      title
      publicDetails
      client {
        id
        username
        firstName
        lastName
        email
      }
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
}
    `;
export type UpdateNoteMutationFn = Apollo.MutationFunction<UpdateNoteMutation, UpdateNoteMutationVariables>;

/**
 * __useUpdateNoteMutation__
 *
 * To run a mutation, you first call `useUpdateNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNoteMutation, { data, loading, error }] = useUpdateNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateNoteMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNoteMutation, UpdateNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNoteMutation, UpdateNoteMutationVariables>(UpdateNoteDocument, options);
      }
export type UpdateNoteMutationHookResult = ReturnType<typeof useUpdateNoteMutation>;
export type UpdateNoteMutationResult = Apollo.MutationResult<UpdateNoteMutation>;
export type UpdateNoteMutationOptions = Apollo.BaseMutationOptions<UpdateNoteMutation, UpdateNoteMutationVariables>;
export const DeleteNoteDocument = gql`
    mutation DeleteNote($data: DeleteDjangoObjectInput!) {
  deleteNote(data: $data) {
    ... on NoteType {
      id
    }
  }
}
    `;
export type DeleteNoteMutationFn = Apollo.MutationFunction<DeleteNoteMutation, DeleteNoteMutationVariables>;

/**
 * __useDeleteNoteMutation__
 *
 * To run a mutation, you first call `useDeleteNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNoteMutation, { data, loading, error }] = useDeleteNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteNoteMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNoteMutation, DeleteNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNoteMutation, DeleteNoteMutationVariables>(DeleteNoteDocument, options);
      }
export type DeleteNoteMutationHookResult = ReturnType<typeof useDeleteNoteMutation>;
export type DeleteNoteMutationResult = Apollo.MutationResult<DeleteNoteMutation>;
export type DeleteNoteMutationOptions = Apollo.BaseMutationOptions<DeleteNoteMutation, DeleteNoteMutationVariables>;
export const CreateNoteServiceRequestDocument = gql`
    mutation CreateNoteServiceRequest($data: CreateNoteServiceRequestInput!) {
  createNoteServiceRequest(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ServiceRequestType {
      id
      service
    }
  }
}
    `;
export type CreateNoteServiceRequestMutationFn = Apollo.MutationFunction<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>;

/**
 * __useCreateNoteServiceRequestMutation__
 *
 * To run a mutation, you first call `useCreateNoteServiceRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteServiceRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteServiceRequestMutation, { data, loading, error }] = useCreateNoteServiceRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteServiceRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>(CreateNoteServiceRequestDocument, options);
      }
export type CreateNoteServiceRequestMutationHookResult = ReturnType<typeof useCreateNoteServiceRequestMutation>;
export type CreateNoteServiceRequestMutationResult = Apollo.MutationResult<CreateNoteServiceRequestMutation>;
export type CreateNoteServiceRequestMutationOptions = Apollo.BaseMutationOptions<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>;
export const DeleteServiceRequestDocument = gql`
    mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {
  deleteServiceRequest(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ServiceRequestType {
      id
    }
  }
}
    `;
export type DeleteServiceRequestMutationFn = Apollo.MutationFunction<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>;

/**
 * __useDeleteServiceRequestMutation__
 *
 * To run a mutation, you first call `useDeleteServiceRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteServiceRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteServiceRequestMutation, { data, loading, error }] = useDeleteServiceRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteServiceRequestMutation(baseOptions?: Apollo.MutationHookOptions<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>(DeleteServiceRequestDocument, options);
      }
export type DeleteServiceRequestMutationHookResult = ReturnType<typeof useDeleteServiceRequestMutation>;
export type DeleteServiceRequestMutationResult = Apollo.MutationResult<DeleteServiceRequestMutation>;
export type DeleteServiceRequestMutationOptions = Apollo.BaseMutationOptions<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>;
export const CreateNoteMoodDocument = gql`
    mutation CreateNoteMood($data: CreateNoteMoodInput!) {
  createNoteMood(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on MoodType {
      id
      descriptor
    }
  }
}
    `;
export type CreateNoteMoodMutationFn = Apollo.MutationFunction<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>;

/**
 * __useCreateNoteMoodMutation__
 *
 * To run a mutation, you first call `useCreateNoteMoodMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteMoodMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteMoodMutation, { data, loading, error }] = useCreateNoteMoodMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteMoodMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>(CreateNoteMoodDocument, options);
      }
export type CreateNoteMoodMutationHookResult = ReturnType<typeof useCreateNoteMoodMutation>;
export type CreateNoteMoodMutationResult = Apollo.MutationResult<CreateNoteMoodMutation>;
export type CreateNoteMoodMutationOptions = Apollo.BaseMutationOptions<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>;
export const DeleteMoodDocument = gql`
    mutation DeleteMood($data: DeleteDjangoObjectInput!) {
  deleteMood(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on DeletedObjectType {
      id
    }
  }
}
    `;
export type DeleteMoodMutationFn = Apollo.MutationFunction<DeleteMoodMutation, DeleteMoodMutationVariables>;

/**
 * __useDeleteMoodMutation__
 *
 * To run a mutation, you first call `useDeleteMoodMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMoodMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMoodMutation, { data, loading, error }] = useDeleteMoodMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteMoodMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMoodMutation, DeleteMoodMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMoodMutation, DeleteMoodMutationVariables>(DeleteMoodDocument, options);
      }
export type DeleteMoodMutationHookResult = ReturnType<typeof useDeleteMoodMutation>;
export type DeleteMoodMutationResult = Apollo.MutationResult<DeleteMoodMutation>;
export type DeleteMoodMutationOptions = Apollo.BaseMutationOptions<DeleteMoodMutation, DeleteMoodMutationVariables>;
export const CreateNoteTaskDocument = gql`
    mutation CreateNoteTask($data: CreateNoteTaskInput!) {
  createNoteTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      title
      status
      dueBy
      client {
        id
      }
      createdBy {
        id
      }
      createdAt
    }
  }
}
    `;
export type CreateNoteTaskMutationFn = Apollo.MutationFunction<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>;

/**
 * __useCreateNoteTaskMutation__
 *
 * To run a mutation, you first call `useCreateNoteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteTaskMutation, { data, loading, error }] = useCreateNoteTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteTaskMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>(CreateNoteTaskDocument, options);
      }
export type CreateNoteTaskMutationHookResult = ReturnType<typeof useCreateNoteTaskMutation>;
export type CreateNoteTaskMutationResult = Apollo.MutationResult<CreateNoteTaskMutation>;
export type CreateNoteTaskMutationOptions = Apollo.BaseMutationOptions<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($data: UpdateTaskInput!) {
  updateTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      title
      status
      dueBy
      client {
        id
      }
      createdBy {
        id
      }
      createdAt
    }
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
      }
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($id: ID!) {
  deleteTask(data: {id: $id}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
    }
  }
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CreateNoteAttachmentDocument = gql`
    mutation CreateNoteAttachment($noteId: ID!, $namespace: NoteNamespaceEnum!, $file: Upload!) {
  createNoteAttachment(data: {note: $noteId, namespace: $namespace, file: $file}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteAttachmentType {
      id
      attachmentType
      file {
        name
      }
      originalFilename
      namespace
    }
  }
}
    `;
export type CreateNoteAttachmentMutationFn = Apollo.MutationFunction<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>;

/**
 * __useCreateNoteAttachmentMutation__
 *
 * To run a mutation, you first call `useCreateNoteAttachmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteAttachmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteAttachmentMutation, { data, loading, error }] = useCreateNoteAttachmentMutation({
 *   variables: {
 *      noteId: // value for 'noteId'
 *      namespace: // value for 'namespace'
 *      file: // value for 'file'
 *   },
 * });
 */
export function useCreateNoteAttachmentMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>(CreateNoteAttachmentDocument, options);
      }
export type CreateNoteAttachmentMutationHookResult = ReturnType<typeof useCreateNoteAttachmentMutation>;
export type CreateNoteAttachmentMutationResult = Apollo.MutationResult<CreateNoteAttachmentMutation>;
export type CreateNoteAttachmentMutationOptions = Apollo.BaseMutationOptions<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>;
export const DeleteNoteAttachmentDocument = gql`
    mutation DeleteNoteAttachment($attachmentId: ID!) {
  deleteNoteAttachment(data: {id: $attachmentId}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteAttachmentType {
      id
    }
  }
}
    `;
export type DeleteNoteAttachmentMutationFn = Apollo.MutationFunction<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>;

/**
 * __useDeleteNoteAttachmentMutation__
 *
 * To run a mutation, you first call `useDeleteNoteAttachmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNoteAttachmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNoteAttachmentMutation, { data, loading, error }] = useDeleteNoteAttachmentMutation({
 *   variables: {
 *      attachmentId: // value for 'attachmentId'
 *   },
 * });
 */
export function useDeleteNoteAttachmentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>(DeleteNoteAttachmentDocument, options);
      }
export type DeleteNoteAttachmentMutationHookResult = ReturnType<typeof useDeleteNoteAttachmentMutation>;
export type DeleteNoteAttachmentMutationResult = Apollo.MutationResult<DeleteNoteAttachmentMutation>;
export type DeleteNoteAttachmentMutationOptions = Apollo.BaseMutationOptions<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>;
export const UpdateNoteLocationDocument = gql`
    mutation UpdateNoteLocation($data: UpdateNoteLocationInput!) {
  updateNoteLocation(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteType {
      id
      point
      address {
        street
        city
        state
        zipCode
      }
    }
  }
}
    `;
export type UpdateNoteLocationMutationFn = Apollo.MutationFunction<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>;

/**
 * __useUpdateNoteLocationMutation__
 *
 * To run a mutation, you first call `useUpdateNoteLocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNoteLocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNoteLocationMutation, { data, loading, error }] = useUpdateNoteLocationMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateNoteLocationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>(UpdateNoteLocationDocument, options);
      }
export type UpdateNoteLocationMutationHookResult = ReturnType<typeof useUpdateNoteLocationMutation>;
export type UpdateNoteLocationMutationResult = Apollo.MutationResult<UpdateNoteLocationMutation>;
export type UpdateNoteLocationMutationOptions = Apollo.BaseMutationOptions<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>;
export const CurrentUserDocument = gql`
    query currentUser {
  currentUser {
    id
    username
    email
  }
}
    `;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const NotesDocument = gql`
    query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput) {
  notes(filters: $filters, pagination: $pagination) {
    id
    title
    point
    address {
      id
      street
      city
      state
      zipCode
    }
    moods {
      id
      descriptor
    }
    purposes {
      id
      title
    }
    nextSteps {
      id
      title
    }
    providedServices {
      id
      service
      customService
    }
    requestedServices {
      id
      service
      customService
    }
    publicDetails
    privateDetails
    isSubmitted
    client {
      id
      email
      username
    }
    createdBy {
      id
      email
      username
    }
    interactedAt
  }
}
    `;

/**
 * __useNotesQuery__
 *
 * To run a query within a React component, call `useNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useNotesQuery(baseOptions?: Apollo.QueryHookOptions<NotesQuery, NotesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
      }
export function useNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotesQuery, NotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
        }
export function useNotesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<NotesQuery, NotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
        }
export type NotesQueryHookResult = ReturnType<typeof useNotesQuery>;
export type NotesLazyQueryHookResult = ReturnType<typeof useNotesLazyQuery>;
export type NotesSuspenseQueryHookResult = ReturnType<typeof useNotesSuspenseQuery>;
export type NotesQueryResult = Apollo.QueryResult<NotesQuery, NotesQueryVariables>;
export const ViewNoteDocument = gql`
    query ViewNote($id: ID!) {
  note(pk: $id) {
    id
    title
    point
    address {
      id
      street
      city
      state
      zipCode
    }
    attachments {
      id
      file {
        path
        url
        name
        size
      }
      namespace
      attachmentType
    }
    moods {
      id
      descriptor
    }
    purposes {
      id
      title
      status
      createdAt
      createdBy {
        id
        email
        username
      }
    }
    nextSteps {
      id
      title
    }
    providedServices {
      id
      service
      customService
    }
    requestedServices {
      id
      service
      customService
    }
    publicDetails
    privateDetails
    isSubmitted
    client {
      id
    }
    createdBy {
      id
    }
    interactedAt
    createdAt
  }
}
    `;

/**
 * __useViewNoteQuery__
 *
 * To run a query within a React component, call `useViewNoteQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewNoteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewNoteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useViewNoteQuery(baseOptions: Apollo.QueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables> & ({ variables: ViewNoteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
      }
export function useViewNoteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export function useViewNoteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export type ViewNoteQueryHookResult = ReturnType<typeof useViewNoteQuery>;
export type ViewNoteLazyQueryHookResult = ReturnType<typeof useViewNoteLazyQuery>;
export type ViewNoteSuspenseQueryHookResult = ReturnType<typeof useViewNoteSuspenseQuery>;
export type ViewNoteQueryResult = Apollo.QueryResult<ViewNoteQuery, ViewNoteQueryVariables>;