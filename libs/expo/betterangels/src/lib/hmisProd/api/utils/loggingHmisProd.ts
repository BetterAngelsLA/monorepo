import {
  formatDataForLog,
  formatResponseForLog,
  isApiDebug,
} from '@monorepo/expo/shared/clients';

/**
 * Dev-console logging for `ApiClientHmisProd` (mirrors the GraphQL
 * `loggerLink`) — every request, response and failure is logged when
 * `isApiDebug` is on. `isApiDebugExpanded` pretty-prints payloads as JSON and
 * `apiDebugMaxChars` caps logged response bodies. The formatter never throws,
 * so logging can't affect the request.
 */

const parseBodyForLog = (body: BodyInit | null | undefined): unknown => {
  if (typeof body !== 'string') {
    return body ?? '';
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

/**
 * Percent-decoded URL for logs — keeps the encoded `fields` list readable
 * (e.g. `?fields=*,id,screenValues.*`); falls back to the raw URL if
 * decoding fails.
 */
const formatLogUrl = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

export const logHmisProdRequest = (
  method: string,
  url: string,
  body: BodyInit | null | undefined,
): void => {
  if (!isApiDebug) {
    return;
  }

  console.log(
    `[HMIS prod req] ${method} ${formatLogUrl(url)}`,
    formatDataForLog(body ? parseBodyForLog(body) : ''),
  );
};

/**
 * `data` is the already-parsed response body — the client parses it anyway
 * for the caller, so the logger doesn't need to.
 */
export const logHmisProdResponse = (
  url: string,
  status: number,
  durationMs: number,
  data: unknown,
): void => {
  if (!isApiDebug) {
    return;
  }

  console.log(
    `[HMIS prod resp] ${status} ${formatLogUrl(url)} (${durationMs}ms)`,
    formatResponseForLog(data),
  );
};

export const logHmisProdError = (url: string, error: unknown): void => {
  if (!isApiDebug) return;

  console.error(
    `[HMIS prod error] ${formatLogUrl(url)}`,
    formatDataForLog(error),
  );
};
