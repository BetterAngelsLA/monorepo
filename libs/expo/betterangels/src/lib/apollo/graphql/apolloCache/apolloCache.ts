import { InMemoryCache } from '@apollo/client';
import {
  InteractionAuthorFilter,
  InteractionAuthorOrder,
  OffsetPaginationInput,
} from '../__generated__/types';
import { paginationPolicy } from './policies/paginationPolicy';

type TGetUsersVars = {
  filters?: InteractionAuthorFilter;
  order?: InteractionAuthorOrder;
  pagination?: OffsetPaginationInput;
};

export function createApolloCache() {
  return new InMemoryCache({
    typePolicies: {
      // Configure keyFields per query
      // example: InteractionAuthor: { keyFields: ['id'] } // 'id' is default, so can omit

      // define how lists are managed (append/merge pages)
      Query: {
        fields: {
          interactionAuthors: paginationPolicy<
            // TItem (for internal help, unused in policy type):
            { id: string; __typename: 'InteractionAuthorTypeOffsetPaginated' },
            TGetUsersVars
          >({
            keyArgs: ['filters', 'order'],
          }),
        },
      },
    },
  });
}
