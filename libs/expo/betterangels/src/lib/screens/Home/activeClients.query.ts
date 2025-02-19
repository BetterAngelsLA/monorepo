import { gql } from '@apollo/client';
import { FULL_CLIENT_PROFILE_FIELDS_FRAGMENT } from '../../apollo/graphql/fragments/clientProfile';

export const ACTIVE_CLIENT_PROFILES_PAGINATED = gql`
  query ActiveClientProfilesPaginated(
    $filters: ClientProfileFilter
    $pagination: OffsetPaginationInput
    $order: ClientProfileOrder
  ) {
    clientProfilesPaginated(
      filters: $filters
      pagination: $pagination
      order: $order
    ) {
      totalCount
      pageInfo {
        limit
        offset
      }
      results {
        ...FullClientProfileFields
      }
    }
  }
  ${FULL_CLIENT_PROFILE_FIELDS_FRAGMENT}
`;
