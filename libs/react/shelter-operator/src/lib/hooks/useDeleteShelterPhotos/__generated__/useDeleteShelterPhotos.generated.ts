import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type DeleteShelterPhotosMutationVariables = Types.Exact<{
  data: Types.BulkDeleteInput;
}>;


export type DeleteShelterPhotosMutation = { __typename: 'Mutation', deleteShelterPhotos:
    | { __typename: 'BulkDeleteResult', ids: Array<string> }
    | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> }
   };


export const DeleteShelterPhotosDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteShelterPhotos"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkDeleteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteShelterPhotos"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BulkDeleteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ids"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeleteShelterPhotosMutation, DeleteShelterPhotosMutationVariables>;