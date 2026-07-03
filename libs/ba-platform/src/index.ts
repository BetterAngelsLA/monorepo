/**
 * Main entry point — ``@monorepo/ba-platform``.
 *
 * Exports code that is safe for **all** BetterAngels frontend apps
 * (web, Expo / React Native, etc.). No framework-specific imports
 * (``react-native``, ``document.cookie``, etc.) are present or
 * transitively resolved through this entry point.
 *
 * Framework-specific code has its own entry points:
 * - ``@monorepo/ba-platform/react`` — web-only (CSRF, cookies, etc.)
 * - ``@monorepo/ba-platform/expo``  — RN-only (AsyncStorage, native fetch, etc.)
 */
export * from './lib';
