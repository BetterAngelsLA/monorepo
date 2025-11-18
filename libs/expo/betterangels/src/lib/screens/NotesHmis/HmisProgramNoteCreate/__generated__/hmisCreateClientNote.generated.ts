import type * as Types from '../../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type HmisCreateClientNoteMutationVariables = Types.Exact<{
  clientNoteInput: Types.HmisCreateClientNoteInput;
}>;


export type HmisCreateClientNoteMutation = { __typename?: 'Mutation', hmisCreateClientNote:
    | { __typename?: 'HmisClientNoteType', id?: string | null, title?: string | null, note?: string | null, date?: string | null, category?: string | null, client?: { __typename?: 'HmisClientType', personalId?: string | null } | null, enrollment?: { __typename?: 'HmisEnrollmentType', enrollmentId?: string | null } | null }
    | { __typename?: 'HmisCreateClientNoteError', message: string, field?: string | null }
   };


export const HmisCreateClientNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"hmisCreateClientNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientNoteInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HmisCreateClientNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hmisCreateClientNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientNoteInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientNoteInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HmisClientNoteType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"client"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personalId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"enrollment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enrollmentId"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HmisCreateClientNoteError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}}]} as unknown as DocumentNode<HmisCreateClientNoteMutation, HmisCreateClientNoteMutationVariables>;