import { isApiDebug } from '../../../static';

/**
 * Dev-console logging for `ApiClientHmisProd` (mirrors the GraphQL
 * `loggerLink`) — every request, response and failure is logged when
 * `isApiDebug` is on. The formatter never throws, so logging can't affect the
 * request.
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
 * Compact `<host><path>` + decoded query params for logs — keeps the
 * percent-encoded `fields` value readable and the environment host visible
 * (sandbox vs LA prod) without repeating the full URL on every line.
 */
const formatLogTarget = (
  url: string,
): { target: string; params?: Record<string, string> } => {
  try {
    const queryStart = url.indexOf('?');
    const base = queryStart === -1 ? url : url.slice(0, queryStart);
    const query = queryStart === -1 ? '' : url.slice(queryStart + 1);
    const params: Record<string, string> = {};

    query.split('&').forEach((pair) => {
      if (!pair) return;

      const separatorIndex = pair.indexOf('=');
      const key = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
      const value = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);

      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return {
      target: base.replace(/^https?:\/\//, ''),
      params: Object.keys(params).length ? params : undefined,
    };
  } catch {
    return { target: url };
  }
};

/**
 * Caps logged response bodies so large payloads (e.g. a 50-item search
 * result) don't flood the console. Bodies up to this size are logged as
 * objects; larger ones as a truncated JSON string.
 */
const MAX_LOGGED_RESPONSE_CHARS = 500;

const formatResponseForLog = (data: unknown): unknown => {
  let text: string;

  try {
    text = JSON.stringify(data) ?? String(data);
  } catch {
    return data;
  }

  if (text.length <= MAX_LOGGED_RESPONSE_CHARS) {
    return data;
  }

  return `${text.slice(0, MAX_LOGGED_RESPONSE_CHARS)}… [truncated — ${text.length} chars total]`;
};

export const logHmisProdRequest = (
  method: string,
  url: string,
  body: BodyInit | null | undefined,
): void => {
  if (!isApiDebug) return;

  const { target, params } = formatLogTarget(url);

  console.log(`[HMIS prod req] ${method} ${target}`, {
    ...(params ? { params } : {}),
    ...(body ? { body: parseBodyForLog(body) } : {}),
  });
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
  if (!isApiDebug) return;

  const { target } = formatLogTarget(url);

  console.log(
    `[HMIS prod resp] ${status} ${target} (${durationMs}ms)`,
    formatResponseForLog(data),
  );
};

export const logHmisProdError = (url: string, error: unknown): void => {
  if (!isApiDebug) return;

  const { target } = formatLogTarget(url);

  console.error(`[HMIS prod error] ${target}`, error);
};
