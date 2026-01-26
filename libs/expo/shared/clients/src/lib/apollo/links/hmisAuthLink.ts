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
import * as R from 'remeda';
import { concatMap } from 'rxjs';
import { Cookie } from 'tough-cookie';
import {
  HMIS_DIRECTIVE_NAME,
  HMIS_TOKEN_HEADER_NAME,
  MODERN_BROWSER_USER_AGENT,
} from '../../common/constants';
import { operationHasDirective } from '../utils/schemaDirectives';

/**
 * Parses Set-Cookie header string into indexed cookie objects.
 * Handles React Native fetch's combined header format.
 */
function parseSetCookieHeaders(
  raw: string | null | undefined
): Record<string, Cookie> {
  if (!raw) return {};

  return R.pipe(
    raw.split(/,(?=[^;]+=[^;]+)/g),
    R.map((s) => s.trim()),
    R.filter(Boolean),
    R.flatMap((header) => {
      try {
        const cookie = Cookie.parse(header);
        return cookie ? [cookie] : [];
      } catch {
        return [];
      }
    }),
    R.indexBy((cookie) => cookie.key.toLowerCase())
  );
}

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
          };

          const raw = headers.get?.('set-cookie');
          const cookies = parseSetCookieHeaders(raw);

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
