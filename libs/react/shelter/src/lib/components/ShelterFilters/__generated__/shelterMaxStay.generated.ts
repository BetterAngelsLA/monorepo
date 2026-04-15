import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ShelterMaxStayQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type ShelterMaxStayQuery = { __typename?: 'Query', shelterMaxStay?: number | null };


export const ShelterMaxStayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShelterMaxStay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shelterMaxStay"}}]}}]} as unknown as DocumentNode<ShelterMaxStayQuery, ShelterMaxStayQueryVariables>;