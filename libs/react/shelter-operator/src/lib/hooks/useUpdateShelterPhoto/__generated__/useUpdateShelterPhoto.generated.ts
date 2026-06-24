import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdateShelterPhotoMutationVariables = Types.Exact<{
  data: Types.UpdateShelterPhotoInput;
}>;


export type UpdateShelterPhotoMutation = { __typename?: 'Mutation', updateShelterPhoto:
    | { __typename: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', message: string }> }
    | { __typename: 'ShelterPhotoType', id: string, type: Types.ShelterPhotoTypeChoices }
   };


export const UpdateShelterPhotoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateShelterPhoto"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateShelterPhotoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateShelterPhoto"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShelterPhotoType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateShelterPhotoMutation, UpdateShelterPhotoMutationVariables>;