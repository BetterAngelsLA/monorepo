/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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
  /** Date with time (isoformat) */
  DateTime: { input: any; output: any; }
};

export type CreateMoodInput = {
  title: MoodEnum;
};

export type CreateNoteInput = {
  client?: InputMaybe<UserInput>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateNotePayload = NoteType | OperationInfo;

export type DeleteDjangoObjectInput = {
  id: Scalars['ID']['input'];
};

export type DeleteNotePayload = NoteType | OperationInfo;

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
  title: MoodEnum;
};

export type Mutation = {
  __typename?: 'Mutation';
  createNote: CreateNotePayload;
  deleteNote: DeleteNotePayload;
  generateMagicLink: MagicLinkResponse;
  logout: Scalars['Boolean']['output'];
  updateNote: UpdateNotePayload;
};


export type MutationCreateNoteArgs = {
  data: CreateNoteInput;
};


export type MutationDeleteNoteArgs = {
  data: DeleteDjangoObjectInput;
};


export type MutationGenerateMagicLinkArgs = {
  data: MagicLinkInput;
};


export type MutationUpdateNoteArgs = {
  data: UpdateNoteInput;
};

export type NoteType = {
  __typename?: 'NoteType';
  client?: Maybe<UserType>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: UserType;
  id: Scalars['ID']['output'];
  isSubmitted: Scalars['Boolean']['output'];
  moods: Array<MoodType>;
  publicDetails?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
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
  currentUser: UserType;
  note: NoteType;
  notes: Array<NoteType>;
};


export type QueryNoteArgs = {
  pk: Scalars['ID']['input'];
};


export type QueryNotesArgs = {
  pagination?: InputMaybe<OffsetPaginationInput>;
};

export type UpdateNoteInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  isSubmitted?: InputMaybe<Scalars['Boolean']['input']>;
  moods?: InputMaybe<Array<CreateMoodInput>>;
  publicDetails?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type UpdateNotePayload = NoteType | OperationInfo;

export type UserInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type UserType = {
  __typename?: 'UserType';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, email: string } };

export type NotesQueryVariables = Exact<{ [key: string]: never; }>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, publicDetails?: string | null, createdAt: any }> };


export const CurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CurrentUserQuery, CurrentUserQueryVariables>;
export const NotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"notes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"publicDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<NotesQuery, NotesQueryVariables>;