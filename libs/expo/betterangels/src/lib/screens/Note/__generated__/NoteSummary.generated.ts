import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NoteSummaryQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type NoteSummaryQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, createdAt: any, interactedAt: any, isSubmitted: boolean, publicDetails: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, client?: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, clientProfile?: { __typename?: 'DjangoModelType', id: string } | null } | null, createdBy: { __typename?: 'UserType', id: string }, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }> } };


export const NoteSummaryDocument = gql`
    query NoteSummary($id: ID!) {
  note(pk: $id) {
    ... on NoteType {
      id
      createdAt
      interactedAt
      isSubmitted
      publicDetails
      purpose
      team
      client {
        id
        email
        firstName
        lastName
        clientProfile {
          id: pk
        }
      }
      createdBy {
        id
      }
      location {
        address {
          id
          street
          city
          state
          zipCode
        }
        point
        pointOfInterest
      }
      moods {
        id
        descriptor
      }
      providedServices {
        id
        service
        serviceOther
      }
      requestedServices {
        id
        service
        serviceOther
      }
    }
  }
}
    `;

/**
 * __useNoteSummaryQuery__
 *
 * To run a query within a React component, call `useNoteSummaryQuery` and pass it any options that fit your needs.
 * When your component renders, `useNoteSummaryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNoteSummaryQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useNoteSummaryQuery(baseOptions: Apollo.QueryHookOptions<NoteSummaryQuery, NoteSummaryQueryVariables> & ({ variables: NoteSummaryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NoteSummaryQuery, NoteSummaryQueryVariables>(NoteSummaryDocument, options);
      }
export function useNoteSummaryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NoteSummaryQuery, NoteSummaryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NoteSummaryQuery, NoteSummaryQueryVariables>(NoteSummaryDocument, options);
        }
export function useNoteSummarySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NoteSummaryQuery, NoteSummaryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NoteSummaryQuery, NoteSummaryQueryVariables>(NoteSummaryDocument, options);
        }
export type NoteSummaryQueryHookResult = ReturnType<typeof useNoteSummaryQuery>;
export type NoteSummaryLazyQueryHookResult = ReturnType<typeof useNoteSummaryLazyQuery>;
export type NoteSummarySuspenseQueryHookResult = ReturnType<typeof useNoteSummarySuspenseQuery>;
export type NoteSummaryQueryResult = Apollo.QueryResult<NoteSummaryQuery, NoteSummaryQueryVariables>;