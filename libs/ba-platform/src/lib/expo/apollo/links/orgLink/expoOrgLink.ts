import { createOrgLink } from '@monorepo/ba-platform';
import { asyncStorageAdapter } from '@monorepo/expo/shared/utils';

/**
 * Pre-configured orgLink for Expo / React Native.
 *
 * Automatically attaches the ``X-Organization-ID`` header to every
 * GraphQL request by reading the active org ID from ``AsyncStorage``.
 * Included by default in ``createApolloClient``.
 */
export const expoOrgLink = createOrgLink(asyncStorageAdapter);
