/**
 * Web-only entry point — ``@monorepo/ba-platform/web``.
 *
 * Exports code that depends on browser APIs (``document.cookie``,
 * ``localStorage``, etc.) and must never be resolved by Expo / React Native.
 *
 * This is a separate NX project (``ba-platform-web``) so that
 * ``depConstraints`` mechanically prevent web code from importing
 * expo code and vice versa.
 */
export { createWebFetchClient } from './lib/fetchClient';
