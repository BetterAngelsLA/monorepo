import type * as Types from '@monorepo/ba-platform/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ShelterCitiesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type ShelterCitiesQuery = { __typename?: 'Query', shelterCities: { __typename?: 'CityTypeOffsetPaginated', results: Array<{ __typename?: 'CityType', id: string, name: string }> } };


export const ShelterCitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShelterCities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shelterCities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ShelterCitiesQuery, ShelterCitiesQueryVariables>;