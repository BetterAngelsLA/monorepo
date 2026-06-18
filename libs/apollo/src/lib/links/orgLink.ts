import { ApolloLink } from '@apollo/client';

/** localStorage key for the active organization ID — shared across all apps and tabs. */
export const ACTIVE_ORG_STORAGE_KEY = 'betterangels_active_org_id';

/**
 * Apollo Link that injects the ``X-Organization-ID`` header into every
 * GraphQL request.  Reads the active organization from ``localStorage``
 * so the header survives page reloads and is shared across tabs.
 */
export const orgLink = new ApolloLink((operation, forward) => {
  try {
    const orgId = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
    if (orgId) {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          'X-Organization-ID': orgId,
        },
      }));
    }
  } catch {
    // localStorage may be unavailable (SSR / test environments).
  }
  return forward(operation);
});
