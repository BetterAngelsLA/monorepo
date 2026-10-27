import type * as Types from '@monorepo/ba-platform/types';

import type { DateString, DateTimeString, PhoneNumberString, TimeString, UUIDString } from '@monorepo/shared/scalars';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdateMediaLinkMutationVariables = Types.Exact<{
  data: Types.UpdateMediaLinkInput;
}>;


export type UpdateMediaLinkMutation = { __typename: 'Mutation', updateMediaLink:
    | { __typename: 'MediaLinkType', id: string, url: string, title: string, mediaType: Types.MediaLinkTypeChoices }
    | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> }
   };


export const UpdateMediaLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMediaLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMediaLinkInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMediaLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MediaLinkType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"mediaType"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateMediaLinkMutation, UpdateMediaLinkMutationVariables>;