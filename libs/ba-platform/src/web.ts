/**
 * Web-only entry point — ``@monorepo/ba-platform/web``.
 *
 * Exports code that depends on browser APIs (``document.cookie``,
 * ``localStorage``, etc.) and must never be resolved by Expo / React Native.
 *
 * TODO: graduate to separate NX project ``ba-platform-web``
 * (per ``docs/styleguides/nx.md`` ba-platform project split).
 */
export { createWebFetchClient, CSRF_COOKIE_NAME, DEFAULT_ORG_STORAGE_KEY } from './lib/fetchClient';
