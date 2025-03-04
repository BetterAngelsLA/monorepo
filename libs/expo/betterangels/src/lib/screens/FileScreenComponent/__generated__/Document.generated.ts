import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientDocumentQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ClientDocumentQuery = { __typename?: 'Query', clientDocument: { __typename?: 'ClientDocumentType', id: string, createdAt: any, namespace: Types.ClientDocumentNamespaceEnum, originalFilename?: string | null, attachmentType: Types.AttachmentType, mimeType: string, file: { __typename?: 'DjangoFileType', url: string, name: string } } };


export const ClientDocumentDocument = gql`
    query ClientDocument($id: ID!) {
  clientDocument(pk: $id) {
    ... on ClientDocumentType {
      id
      createdAt
      namespace
      originalFilename
      attachmentType
      mimeType
      file {
        url
        name
      }
    }
  }
}
    `;

/**
 * __useClientDocumentQuery__
 *
 * To run a query within a React component, call `useClientDocumentQuery` and pass it any options that fit your needs.
 * When your component renders, `useClientDocumentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClientDocumentQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useClientDocumentQuery(baseOptions: Apollo.QueryHookOptions<ClientDocumentQuery, ClientDocumentQueryVariables> & ({ variables: ClientDocumentQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClientDocumentQuery, ClientDocumentQueryVariables>(ClientDocumentDocument, options);
      }
export function useClientDocumentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClientDocumentQuery, ClientDocumentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClientDocumentQuery, ClientDocumentQueryVariables>(ClientDocumentDocument, options);
        }
export function useClientDocumentSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClientDocumentQuery, ClientDocumentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientDocumentQuery, ClientDocumentQueryVariables>(ClientDocumentDocument, options);
        }
export type ClientDocumentQueryHookResult = ReturnType<typeof useClientDocumentQuery>;
export type ClientDocumentLazyQueryHookResult = ReturnType<typeof useClientDocumentLazyQuery>;
export type ClientDocumentSuspenseQueryHookResult = ReturnType<typeof useClientDocumentSuspenseQuery>;
export type ClientDocumentQueryResult = Apollo.QueryResult<ClientDocumentQuery, ClientDocumentQueryVariables>;