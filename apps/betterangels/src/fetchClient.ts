// ---------------------------------------------------------------------------
// The native fetch client — a platform pair with `fetchClient.web.ts`.
//
// A pair rather than a `Platform.OS` branch, because the two adapters must never
// share a bundle: an ES import is evaluated whether or not a branch uses it.
//
// Both files must export the same surface; `init.ts` re-exports through this
// path, so a missing export is a web-only runtime error.
// ---------------------------------------------------------------------------
import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import {
  createRefererInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
  userAgentInterceptor,
} from '@monorepo/expo/shared/clients';

/** `apiUrl` is both the request target and the referer the backend expects. */
export const buildFetchClient = (apiUrl: string) =>
  createExpoFetchClient(apiUrl, [
    createRefererInterceptor(apiUrl),
    userAgentInterceptor,
    hmisAuthInterceptor,
    interceptorHmis,
  ]);
