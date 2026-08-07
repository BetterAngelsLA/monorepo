import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

const SEARCH_CLIENTS_QUERY = gql`
  query SearchClients($search: String!, $pagination: OffsetPaginationInput) {
    clientProfiles(filters: { search: $search }, pagination: $pagination) {
      results {
        id
        firstName
        middleName
        lastName
        nickname
        email
        dateOfBirth
        phoneNumber
        californiaId
      }
      totalCount
    }
  }
`;

export interface ClientProfileResult {
  id: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  californiaId?: string | null;
}

export interface SearchClientsData {
  clientProfiles: {
    results: ClientProfileResult[];
    totalCount: number;
  };
}

export interface SearchClientsVariables {
  search: string;
  pagination?: { offset: number; limit: number } | null;
}

export function useSearchClient() {
  const [search, queryResult] = useLazyQuery<
    SearchClientsData,
    SearchClientsVariables
  >(SEARCH_CLIENTS_QUERY);

  return [search, queryResult] as const;
}
