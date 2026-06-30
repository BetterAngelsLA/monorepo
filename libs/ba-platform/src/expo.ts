/**
 * Expo / React Native entry point — ``@monorepo/ba-platform/expo``.
 *
 * Code that depends on RN-only APIs (``AsyncStorage``, ``Platform.OS``,
 * native fetch, etc.) is exported from here so that web apps never
 * resolve it at compile time.
 *
 * Currently empty. Expo-specific Apollo client + ApolloClientProvider
 * will be migrated here in a follow-up PR (feat/consolidate-apollo-clients).
 */
export {};
