/**
 * Direct-HMIS fetch interceptors — web build. HMIS is unsupported on web, so
 * every export is inert. The module exists so the shared clients barrel can be
 * imported in a browser without pulling in
 * `@preeternal/react-native-cookie-manager`, whose import-time
 * `TurboModuleRegistry.getEnforcing('CookieManager')` throws before React
 * renders; the native mechanism cannot be ported — see `./hmisInterceptors.ts`.
 *
 * Keep the export surface identical to `./hmisInterceptors.ts`.
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
