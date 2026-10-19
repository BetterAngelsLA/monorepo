/**
 * Verbose API logging to the dev console — GraphQL operations (via
 * `loggerLink`) and direct HMIS REST requests (`ApiClientHmisProd`).
 *
 * Opt in locally with `EXPO_PUBLIC_API_DEBUG=true` (e.g. in
 * `apps/betterangels/.env.local`); never enabled in production builds.
 * `EXPO_PUBLIC_API_DEBUG_EXPANDED=true` pretty-prints payloads as JSON and
 * `EXPO_PUBLIC_API_DEBUG_MAX_CHARS=N` caps logged response bodies (unset = no
 * cap).
 */

const isNotProduction = process.env['NODE_ENV'] !== 'production';

export const isApiDebug =
  isNotProduction && process.env['EXPO_PUBLIC_API_DEBUG'] === 'true';

export const isApiDebugExpanded =
  isNotProduction && process.env['EXPO_PUBLIC_API_DEBUG_EXPANDED'] === 'true';

export const apiDebugMaxChars: number =
  parseInt(process.env['EXPO_PUBLIC_API_DEBUG_MAX_CHARS']) || Infinity;

/** `null` when the value can't be stringified (e.g. circular references). */
const stringifyForLog = (data: unknown, pretty: boolean): string | null => {
  try {
    return (
      (pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)) ??
      String(data)
    );
  } catch {
    return null;
  }
};

/** Pretty-prints payloads only when `EXPO_PUBLIC_API_DEBUG_EXPANDED` is on. */
export const formatDataForLog = (data: unknown): unknown => {
  if (!isApiDebugExpanded || typeof data === 'string') {
    return data;
  }

  return stringifyForLog(data, true) ?? data;
};

/**
 * Caps logged response bodies when `EXPO_PUBLIC_API_DEBUG_MAX_CHARS` is set
 * (`apiDebugMaxChars`; unset = no cap) so large payloads (e.g. a page of
 * results) don't flood the console. Within the cap, bodies are logged as
 * objects — or pretty JSON when expanded; over it, as a truncated string.
 */
export const formatResponseForLog = (data: unknown): unknown => {
  const text = stringifyForLog(data, isApiDebugExpanded);

  if (text === null) {
    return data;
  }

  if (text.length <= apiDebugMaxChars) {
    return isApiDebugExpanded ? text : data;
  }

  return `${text.slice(0, apiDebugMaxChars)}… [truncated — ${text.length} chars total]`;
};
