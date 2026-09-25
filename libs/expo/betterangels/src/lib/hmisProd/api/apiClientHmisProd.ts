import {
  getAuthHeadersHmis,
  HEADER_NAMES,
  HEADER_VALUES,
  HMIS_AUTH_DOMAIN_STORAGE_KEY,
  MODERN_BROWSER_USER_AGENT,
} from '@monorepo/expo/shared/clients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CLIENT_DETAIL_FIELDS_DEFAULT,
  CLIENT_SEARCH_FIELDS_DEFAULT,
  HMIS_PROD_CLIENTS_LONG_PATH,
  HMIS_PROD_CLIENTS_PATH,
} from './constants';
import { ErrorHmisProd } from './errors';
import type {
  GetClientPayloadHmisProd,
  HmisProdClientDetail,
  HmisProdRequestContext,
  HmisProdRequestDebugInfo,
  HmisProdRequestResult,
  SearchClientsPayloadHmisProd,
  SearchClientsResponseHmisProd,
} from './types';
import {
  logHmisProdError,
  logHmisProdRequest,
  logHmisProdResponse,
} from './utils';

/**
 * Direct HMIS ("prod") REST client — experimental, gated by
 * `FeatureFlags.HMIS_PROD_DEMO`. Named `Api…` so the transport class isn't
 * confused with an HMIS client (person) record.
 *
 * Feature-private: not exported from the `lib/hmisProd` barrel, so it can't
 * leak into other screens and goes away with the feature.
 *
 * Auth reuses the shared HMIS plumbing: `getAuthHeadersHmis` reads the
 * `auth_token` cookie from the native jar captured at HMIS login, so whichever
 * environment the user logged into (sandbox / LA prod) is the one we talk to.
 *
 * Every request captures a debug payload (full URL, status, auth context and
 * the raw response body) on success and failure alike — see
 * `HmisProdRequestDebugInfo`.
 *
 * TODO: replace once Clarity ships their new REST API.
 */

const DEFAULT_SEARCH_PAYLOAD = {
  expand: 'userCreated,userUpdated',
  page: 1,
  per_page: 50, // pagination not implemented, so setting this high
  sort: '-last_updated',
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

/**
 * Host the HMIS token was stored under (`hmis_auth_domain`) — included in the
 * debug payload so a token/environment mismatch (e.g. an LA token sent to the
 * sandbox host) is visible in what testers copy.
 */
const getHmisAuthDomainHost = async (): Promise<string | null> => {
  try {
    const stored = await AsyncStorage.getItem(HMIS_AUTH_DOMAIN_STORAGE_KEY);

    return stored ? new URL(stored).host : null;
  } catch {
    return null;
  }
};

/** Clarity answers unauthenticated web-style POSTs with its Yii CSRF guard. */
const CSRF_MISMATCH_PATTERN = /csrf token mismatch/i;

class ApiClientHmisProd {
  constructor(private readonly baseUrl: string) {}

  /**
   * Search clients via Clarity's "long" endpoint.
   *
   * POST /api1/clients/long
   *
   * `payload.fields` overrides `CLIENT_SEARCH_FIELDS_DEFAULT`; the client
   * joins it into Clarity's comma-separated `fields` value.
   */
  searchClients(
    payload: SearchClientsPayloadHmisProd,
  ): Promise<HmisProdRequestResult<SearchClientsResponseHmisProd>> {
    const { fields = CLIENT_SEARCH_FIELDS_DEFAULT, ...rest } = payload;

    return this.post<SearchClientsResponseHmisProd>(
      HMIS_PROD_CLIENTS_LONG_PATH,
      {
        ...DEFAULT_SEARCH_PAYLOAD,
        ...rest,
        fields: fields.join(','),
      },
    );
  }

  /**
   * Fetch a single client via Clarity's client endpoint.
   *
   * GET /api1/clients/{id}?fields=...&as_array=1
   *
   * Defaults to the fields the Profile tab renders (see
   * `CLIENT_DETAIL_FIELDS_DEFAULT`) — pass `payload.fields` to override;
   * the client joins it into Clarity's comma-separated `fields` value.
   * Sub-fields are requested through `screenValues.*` and read back from the
   * nested `screenValues` object.
   */
  async getClient(
    id: string,
    payload?: GetClientPayloadHmisProd,
  ): Promise<HmisProdRequestResult<HmisProdClientDetail>> {
    const fields = payload?.fields ?? CLIENT_DETAIL_FIELDS_DEFAULT;

    const { data, debugInfo } = await this.get<
      HmisProdClientDetail | HmisProdClientDetail[]
    >(`${HMIS_PROD_CLIENTS_PATH}/${encodeURIComponent(id)}`, {
      fields: fields.join(','),
      as_array: '1',
    });

    // `as_array=1` mirrors the request the Clarity web app sends; unwrap
    // defensively in case the response comes back as a one-item list.
    const client = Array.isArray(data) ? data[0] : data;

    if (!client) {
      throw new ErrorHmisProd('Resource not found', 404, debugInfo);
    }

    return { data: client, debugInfo };
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<HmisProdRequestResult<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers);

    const authHeaders = await getAuthHeadersHmis();

    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    headers.set(HEADER_NAMES.USER_AGENT, MODERN_BROWSER_USER_AGENT);

    const requestContext: HmisProdRequestContext = {
      url,
      hasAuthToken: !!authHeaders['Authorization'],
      authDomain: await getHmisAuthDomainHost(),
    };

    // Fail fast with an actionable message instead of letting Clarity reject
    // the unauthenticated POST with its opaque CSRF error.
    if (!requestContext.hasAuthToken) {
      logHmisProdError(url, 'No HMIS auth token found');

      throw new ErrorHmisProd(
        'Not logged in to HMIS - please log in with your HMIS credentials',
        401,
        {
          ...requestContext,
          response: null,
          requestError: 'No HMIS auth token found',
        },
      );
    }

    logHmisProdRequest(init.method ?? 'GET', url, init.body);

    const startedAt = Date.now();
    const { response, responseText } = await this.fetchWithBody(
      url,
      init,
      headers,
      requestContext,
    );

    const debugInfo: HmisProdRequestDebugInfo = {
      ...requestContext,
      status: response.status,
      response: responseText,
    };

    if (!response.ok) {
      logHmisProdError(url, {
        status: response.status,
        body: parseHmisProdBody(responseText),
      });

      throw this.buildApiError(response, responseText, debugInfo);
    }

    const data = parseHmisProdBody(responseText) as T;

    logHmisProdResponse(url, response.status, Date.now() - startedAt, data);

    return { data, debugInfo };
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
    requestContext: HmisProdRequestContext,
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

      logHmisProdError(url, message);

      throw new ErrorHmisProd(message, 0, {
        ...requestContext,
        response: null,
        requestError: message,
      });
    }
  }

  private get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<HmisProdRequestResult<T>> {
    const query = new URLSearchParams(params).toString();

    return this.request<T>(`${path}?${query}`);
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
          'Unauthorized - please log in again.',
          401,
          debugInfo,
          data,
        );
      case 403:
        // Clarity's CSRF guard rejects unauthenticated web-style POSTs with
        // this message — in practice it means the HMIS session is missing,
        // expired, or doesn't match the target host.
        if (CSRF_MISMATCH_PATTERN.test(responseText ?? '')) {
          return new ErrorHmisProd(
            'HMIS session expired or invalid - please log in again',
            403,
            debugInfo,
            data,
          );
        }

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

// Factory function to create ApiClientHmisProd
export const createApiClientHmisProd = (baseUrl: string) =>
  new ApiClientHmisProd(baseUrl);

export { ApiClientHmisProd };
