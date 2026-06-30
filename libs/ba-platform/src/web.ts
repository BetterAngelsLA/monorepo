/**
 * Web-specific entry point — ``@monorepo/ba-platform/web``.
 *
 * Code that depends on browser-only APIs (``document.cookie``,
 * CSRF tokens, etc.) is exported from here so that React Native /
 * Expo apps never resolve it at compile time.
 */
export * from './lib/apollo/web';
export {};
