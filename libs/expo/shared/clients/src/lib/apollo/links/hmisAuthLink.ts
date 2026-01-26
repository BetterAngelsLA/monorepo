import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  getHmisAuthToken,
  HMIS_API_URL_COOKIE_NAME,
  HMIS_AUTH_COOKIE_NAME,
  storeHmisApiUrl,
  storeHmisAuthToken,
} from '@monorepo/expo/shared/utils';
import { Kind, type OperationDefinitionNode } from 'graphql';
import { concatMap } from 'rxjs';
import {
  parse as parseSetCookie,
  splitCookiesString,
  type Cookie,
} from 'set-cookie-parser';
import {
  HMIS_DIRECTIVE_NAME,
  HMIS_TOKEN_HEADER_NAME,
  MODERN_BROWSER_USER_AGENT,
} from '../../common/constants';
import { operationHasDirective } from '../utils/schemaDirectives';

const parseSetCookieHeaders = (headers: {
  get?: (key: string) => string | null;
  getSetCookie?: () => string[] | null | undefined;
}) => {
  const raw = headers.getSetCookie?.() ?? headers.get?.('set-cookie') ?? [];

  const headerValues = Array.isArray(raw) ? raw : splitCookiesString(raw);
  const cookies = parseSetCookie(headerValues, { map: true }) as Record<
    string,
    Cookie | null
  >;

  return Object.fromEntries(
    Object.entries(cookies)
      .filter((entry): entry is [string, Cookie] => Boolean(entry[1]))
      .map(([name, cookie]) => [name.toLowerCase(), cookie])
  );
};

/**
 * Adds X-HMIS-Token header and sets a browser User-Agent
 * Only adds auth token if one exists in storage (cleared on logout)
 */
export const createAuthHeaderLink = () =>
  new SetContextLink(async (prevContext) => {
    const { headers = {}, ...restContext } = prevContext || {};
    const authToken = await getHmisAuthToken();

    return {
      ...restContext,
      headers: {
        ...headers,
        'User-Agent': MODERN_BROWSER_USER_AGENT,
        ...(authToken && { [HMIS_TOKEN_HEADER_NAME]: authToken }),
      },
    };
  });

/**
 * Extracts and stores HMIS auth values from Set-Cookie headers
 */
export const createCookieExtractorLink = () =>
  new ApolloLink((operation, forward) => {
    return forward(operation).pipe(
      concatMap(async (response) => {
        try {
          const responseObj = operation.getContext()['response'] as
            | Response
            | undefined;
          if (!responseObj) {
            return response;
          }

          const headers = responseObj.headers as {
            get?: (key: string) => string | null;
            getSetCookie?: () => string[] | null | undefined;
          };

          const cookies = parseSetCookieHeaders(headers);

          const authToken = cookies[HMIS_AUTH_COOKIE_NAME.toLowerCase()]?.value;
          const apiUrl = cookies[HMIS_API_URL_COOKIE_NAME.toLowerCase()]?.value;

          if (authToken) {
            await storeHmisAuthToken(authToken);
          }
          if (apiUrl) {
            storeHmisApiUrl(decodeURIComponent(apiUrl));
          }
        } catch (error) {
          if (__DEV__) {
            console.debug(
              '[hmisAuthLink] Failed to store HMIS credentials',
              error
            );
          }
        }

        return response;
      })
    );
  });

/**
 * Apollo link that handles HMIS authentication and cookie management.
 */
export const createHmisAuthLink = (): ApolloLink => {
  return ApolloLink.split((operation) => {
    const operationDef = operation.query.definitions.find(
      (def): def is OperationDefinitionNode =>
        def.kind === Kind.OPERATION_DEFINITION &&
        def.name?.value === operation.operationName
    );
    return operationHasDirective(operationDef, HMIS_DIRECTIVE_NAME);
  }, createCookieExtractorLink().concat(createAuthHeaderLink()));
};
