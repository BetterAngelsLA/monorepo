import {
  getAuthHeadersHmis,
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
} from '@monorepo/expo/shared/clients';
import {
  HMIS_PROD_CLIENT_SEARCH_FIELDS,
  HMIS_PROD_CLIENTS_LONG_PATH,
} from './constants';
import { ErrorHmisProd } from './errorHmisProd';
import type {
  HmisProdRequestDebugInfo,
  HmisProdRequestResult,
  SearchClientsPayloadHmisProd,
  SearchClientsResponseHmisProd,
} from './types';

/**
 * Direct HMIS ("prod") REST client — experimental, gated by
 * `FeatureFlags.HMIS_PROD_DEMO`.
 *
 * Feature-private: not exported from the `lib/hmisProd` barrel, so it can't
 * leak into other screens and goes away with the feature.
 *
 * Auth reuses the shared HMIS plumbing: `getAuthHeadersHmis` reads the
 * `auth_token` cookie from the native jar captured at HMIS login, so whichever
 * environment the user logged into (sandbox / LA prod) is the one we talk to.
 *
 * Every request captures a debug payload (full URL + raw response body) on
 * success and failure alike — see `HmisProdRequestDebugInfo`.
 *
 * TODO: replace once Clarity ships their new REST API.
 */

const DEFAULT_SEARCH_PAYLOAD = {
  expand: 'userCreated,userUpdated',
  page: 1,
  per_page: 10,
  sort: '-last_updated',
  fields: HMIS_PROD_CLIENT_SEARCH_FIELDS,
} as const;

/**
 * HMIS occasionally returns JSON with a wrong/missing Content-Type or a
 * double-encoded JSON string — parse defensively (same as `clientHmis`).
 */
const parseHmisProdBody = (text: string | null): unknown => {
  if (!text) return text;

  try {
    const parsed: unknown = JSON.parse(text);

    if (typeof parsed === 'string') {
      try {
        return JSON.parse(parsed);
      } catch {
        return parsed;
      }
    }

    return parsed;
  } catch {
    return text;
  }
};

class ClientHmisProd {
  constructor(private readonly baseUrl: string) {}

  /**
   * Search clients via Clarity's "long" endpoint.
   *
   * POST /api1/clients/long
   */
  searchClients(
    payload: SearchClientsPayloadHmisProd,
  ): Promise<HmisProdRequestResult<SearchClientsResponseHmisProd>> {
    return this.post<SearchClientsResponseHmisProd>(
      HMIS_PROD_CLIENTS_LONG_PATH,
      { ...DEFAULT_SEARCH_PAYLOAD, ...payload },
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<HmisProdRequestResult<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers);

    Object.entries(await getAuthHeadersHmis()).forEach(([key, value]) => {
      headers.set(key, value);
    });
    headers.set(HEADER_NAMES.USER_AGENT, MODERN_BROWSER_USER_AGENT);

    const { response, responseText } = await this.fetchWithBody(
      url,
      init,
      headers,
    );
    const debugInfo: HmisProdRequestDebugInfo = { url, response: responseText };

    if (!response.ok) {
      throw this.buildApiError(response, responseText, debugInfo);
    }

    return {
      data: parseHmisProdBody(responseText) as T,
      debugInfo,
    };
  }

  /**
   * Fetches `url` and always reads the raw body — success or error — so it can
   * be included in the debug payload. Throws `ErrorHmisProd` (with the url,
   * but no response) when the request never receives an HTTP response.
   */
  private async fetchWithBody(
    url: string,
    init: RequestInit,
    headers: Headers,
  ) {
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
      });

      return { response, responseText: await response.text() };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      throw new ErrorHmisProd(message, 0, {
        url,
        response: null,
        requestError: message,
      });
    }
  }

  private post<T>(
    path: string,
    body: unknown,
  ): Promise<HmisProdRequestResult<T>> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {
        [HEADER_NAMES.CONTENT_TYPE]: HEADER_VALUES.CONTENT_TYPE_JSON,
      },
      body: JSON.stringify(body),
    });
  }

  private buildApiError(
    response: Response,
    responseText: string | null,
    debugInfo: HmisProdRequestDebugInfo,
  ): ErrorHmisProd {
    const data = responseText ? parseHmisProdBody(responseText) : null;

    switch (response.status) {
      case 401:
        return new ErrorHmisProd(
          'Unauthorized - please log in to HMIS with prod credentials',
          401,
          debugInfo,
          data,
        );
      case 403:
        return new ErrorHmisProd(
          'Forbidden - insufficient permissions',
          403,
          debugInfo,
          data,
        );
      case 404:
        return new ErrorHmisProd('Resource not found', 404, debugInfo, data);
      default:
        return new ErrorHmisProd(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          debugInfo,
          data,
        );
    }
  }
}

// Factory function to create ClientHmisProd
export const createClientHmisProd = (baseUrl: string) =>
  new ClientHmisProd(baseUrl);

export { ClientHmisProd };
