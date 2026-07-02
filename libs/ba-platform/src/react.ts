/**
 * Web-specific entry point — ``@monorepo/ba-platform/react``.
 *
 * Code that depends on browser-only APIs (``document.cookie``,
 * CSRF tokens, etc.) is exported from here so that React Native /
 * Expo apps never resolve it at compile time.
 *
 * Currently empty. Web-specific Apollo client + CSRF link will be
 * migrated here in a follow-up PR (feat/consolidate-apollo-clients).
 */
export {};
