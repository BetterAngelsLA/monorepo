import * as Types from '../../../../types';

export type CurrentUserQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, email: string } };

export type NotesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, address?: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, moods: Array<{ __typename?: 'MoodType', descriptor: Types.MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };
