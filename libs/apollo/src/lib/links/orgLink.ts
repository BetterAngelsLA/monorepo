import { ApolloLink } from '@apollo/client';

const STORAGE_KEY = 'betterangels_active_org_id';

/**
 * Injects the X-Organization-ID header from localStorage into every
 * GraphQL request.  The header is read by ``OrganizationMiddleware`` on
 * the backend, attached as ``request.organization_id``, and consumed by
 * ``HasOrgPerm`` extensions and org-scoping selectors.
 */
export const orgLink = new ApolloLink((operation, forward) => {
  const orgId = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(orgId ? { 'X-Organization-ID': orgId } : {}),
    },
  }));

  return forward(operation);
});

