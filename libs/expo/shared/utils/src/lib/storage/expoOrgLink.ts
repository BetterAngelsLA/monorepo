import { createOrgLink } from '@monorepo/ba-platform';
import { asyncStorageAdapter } from './asyncStorageAdapter';

/**
 * Pre-configured ``orgLink`` for Expo / React Native apps.
 *
 * Uses ``AsyncStorage`` to persist the active organization ID so that
 * every GraphQL request includes the ``X-Organization-ID`` header.
 *
 * Pass to :component:`ApolloClientProvider` via its ``links`` prop:
 *
 * ```tsx
 * <ApolloClientProvider links={[expoOrgLink]}>
 * ```
 */
export const expoOrgLink = createOrgLink(asyncStorageAdapter);
