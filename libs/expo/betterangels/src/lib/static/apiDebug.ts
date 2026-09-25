/**
 * Verbose API logging to the dev console — GraphQL operations (via
 * `loggerLink` in `BaDataProviders`) and direct HMIS REST requests
 * (`ApiClientHmisProd`).
 *
 * Opt in locally with `EXPO_PUBLIC_API_DEBUG=true` (e.g. in
 * `apps/betterangels/.env.local`); never enabled in production builds.
 */
export const isApiDebug =
  process.env['EXPO_PUBLIC_API_DEBUG'] === 'true' &&
  process.env['NODE_ENV'] !== 'production';
