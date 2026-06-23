import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { localStorageAdapter, StorageAdapter } from '../../utils/storage';

/** Default localStorage key shared by BA Admin and BA App. */
const DEFAULT_STORAGE_KEY = 'betterangels_active_org_id';

/** @deprecated Use :type:`StorageAdapter` instead. */
export type GetItemFn = StorageAdapter['getItem'];

/**
 * Create an Apollo Link that injects the ``X-Organization-ID`` header
 * from a storage adapter.
 *
 * The header is read by ``OrganizationMiddleware`` on the backend,
 * attached as ``request.organization_id``, and consumed by ``HasOrgPerm``
 * extensions and org-scoping selectors.
 *
 * @param storage  Storage adapter (e.g. :const:`localStorageAdapter` for
 *   web, or an ``AsyncStorage`` wrapper for React Native).
 * @param storageKey  The key used to look up the active org id.
 */
export function createOrgLink(
  storage: StorageAdapter,
  storageKey?: string
): ApolloLink {
  const key = storageKey ?? DEFAULT_STORAGE_KEY;

  return new SetContextLink(async (prevContext) => {
    const orgId = await storage.getItem(key);

    if (!orgId) {
      return { headers: prevContext.headers };
    }

    return {
      headers: {
        ...prevContext.headers,
        'X-Organization-ID': orgId,
      },
    };
  });
}

/**
 * Convenience instance for web apps backed by ``localStorage`` with the
 * default ``betterangels_active_org_id`` key.
 *
 * For Expo / React Native apps use :func:`createOrgLink` with an
 * ``AsyncStorage``-backed :type:`StorageAdapter`.
 */
export const orgLink = createOrgLink(localStorageAdapter);
