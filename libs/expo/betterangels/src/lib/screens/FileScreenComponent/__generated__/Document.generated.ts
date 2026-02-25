import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ClientDocumentQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientDocumentQuery = { __typename?: 'Query', clientDocument: { __typename?: 'ClientDocumentType', id: string, createdAt: any, namespace: Types.ClientDocumentNamespaceEnum, originalFilename?: string | null, attachmentType: Types.AttachmentType, mimeType: string, file: { __typename?: 'DjangoFileType', url: string, name: string } } };


export const ClientDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClientDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientDocument"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pk"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ClientDocumentType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"namespace"}},{"kind":"Field","name":{"kind":"Name","value":"originalFilename"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentType"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ClientDocumentQuery, ClientDocumentQueryVariables>;