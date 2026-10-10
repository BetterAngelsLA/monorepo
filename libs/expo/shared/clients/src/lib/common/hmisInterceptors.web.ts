/**
 * Direct-HMIS fetch interceptors — **web build**.
 *
 * HMIS is not supported on web yet, so every export here is inert. This module
 * exists so that the shared `@monorepo/expo/shared/clients` barrel can be
 * imported in a browser without pulling in
 * `@preeternal/react-native-cookie-manager`, which calls
 * `TurboModuleRegistry.getEnforcing('CookieManager')` at import time and throws
 * before React ever renders.
 *
 * The native implementation in `./hmisInterceptors.ts` cannot be ported as-is:
 * it copies cookies out of the `Set-Cookie` response header, and in a browser
 * `Set-Cookie` is a forbidden header that always reads `null`. Making HMIS work
 * on web needs a different approach entirely — see `docs/outreach-web.md`.
 *
 * Keep this module's export surface identical to `./hmisInterceptors.ts`.
 */
import type { FetchInterceptor } from '@monorepo/fetch';

export interface FileHeadersLoadResultHmis {
  headers: Record<string, string> | null;
  baseUrl: string | null;
}

/** No HMIS session exists on web, so there is never an auth header to send. */
export const getAuthHeadersHmis = async (): Promise<
  Record<string, string>
> => ({});

/** No HMIS session exists on web, so there is no file config to load. */
export const loadFileHeadersHmis =
  async (): Promise<FileHeadersLoadResultHmis> => ({
    headers: null,
    baseUrl: null,
  });

/** Pass-through: no HMIS token to inject. */
export const hmisAuthInterceptor: FetchInterceptor = (_input, init, next) =>
  next(_input, init);

/** Pass-through: no HMIS cookie capture. */
export const interceptorHmis: FetchInterceptor = (_input, init, next) =>
  next(_input, init);
