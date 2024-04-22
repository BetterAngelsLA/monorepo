import * as Types from '../../../../types';

export type GenerateMagicLinkMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type GenerateMagicLinkMutation = { __typename?: 'Mutation', generateMagicLink: { __typename?: 'MagicLinkResponse', message: string } };

export type CreateNoteMutationVariables = Types.Exact<{
  data: Types.CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type UpdateNoteMutationVariables = Types.Exact<{
  data: Types.UpdateNoteInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type DeleteNoteMutationVariables = Types.Exact<{
  data: Types.DeleteDjangoObjectInput;
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: { __typename?: 'NoteType', id: string } | { __typename?: 'OperationInfo' } };

export type CreateNoteServiceRequestMutationVariables = Types.Exact<{
  data: Types.CreateNoteServiceRequestInput;
}>;


export type CreateNoteServiceRequestMutation = { __typename?: 'Mutation', createNoteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum } };

export type DeleteServiceRequestMutationVariables = Types.Exact<{
  data: Types.DeleteDjangoObjectInput;
}>;


export type DeleteServiceRequestMutation = { __typename?: 'Mutation', deleteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string } };

export type CreateNoteMoodMutationVariables = Types.Exact<{
  data: Types.CreateNoteMoodInput;
}>;


export type CreateNoteMoodMutation = { __typename?: 'Mutation', createNoteMood: { __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteMoodMutationVariables = Types.Exact<{
  data: Types.DeleteDjangoObjectInput;
}>;


export type DeleteMoodMutation = { __typename?: 'Mutation', deleteMood: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type CreateNoteTaskMutationVariables = Types.Exact<{
  data: Types.CreateNoteTaskInput;
}>;


export type CreateNoteTaskMutation = { __typename?: 'Mutation', createNoteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: Types.TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type UpdateTaskMutationVariables = Types.Exact<{
  data: Types.UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: Types.TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type DeleteTaskMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string } };

export type CreateNoteAttachmentMutationVariables = Types.Exact<{
  noteId: Types.Scalars['ID']['input'];
  namespace: Types.NoteNamespaceEnum;
  file: Types.Scalars['Upload']['input'];
}>;


export type CreateNoteAttachmentMutation = { __typename?: 'Mutation', createNoteAttachment: { __typename?: 'NoteAttachmentType', id: string, attachmentType: Types.AttachmentType, originalFilename?: string | null, namespace: Types.NoteNamespaceEnum, file: { __typename?: 'DjangoFileType', name: string } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteNoteAttachmentMutationVariables = Types.Exact<{
  attachmentId: Types.Scalars['ID']['input'];
}>;


export type DeleteNoteAttachmentMutation = { __typename?: 'Mutation', deleteNoteAttachment: { __typename?: 'NoteAttachmentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type UpdateNoteLocationMutationVariables = Types.Exact<{
  data: Types.UpdateNoteLocationInput;
}>;


export type UpdateNoteLocationMutation = { __typename?: 'Mutation', updateNoteLocation: { __typename?: 'NoteType', id: string, point?: any | null, address?: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };
