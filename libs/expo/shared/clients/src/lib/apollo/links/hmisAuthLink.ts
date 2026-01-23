import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  getHmisAuthToken,
  HMIS_AUTH_COOKIE_NAME,
  HMIS_API_URL_COOKIE_NAME,
  storeHmisDomain,
  storeHmisApiUrl,
  storeHmisAuthToken,
} from '@monorepo/expo/shared/utils';
import { Kind, type OperationDefinitionNode } from 'graphql';
import { tap } from 'rxjs';
import {
  HMIS_DIRECTIVE_NAME,
  HMIS_TOKEN_HEADER_NAME,
  MODERN_BROWSER_USER_AGENT,
} from '../../common/constants';
import { operationHasDirective } from '../utils/schemaDirectives';

/**
 * Adds X-HMIS-Token header and sets a browser User-Agent
 */
export const createAuthHeaderLink = () =>
  new SetContextLink(async (prevContext) => {
    const authToken = await getHmisAuthToken();
    return {
      ...prevContext,
      headers: {
        ...(prevContext['headers'] ?? {}),
        'User-Agent': MODERN_BROWSER_USER_AGENT,
        ...(authToken ? { [HMIS_TOKEN_HEADER_NAME]: authToken } : {}),
      },
    };
  });

/**
 * Extracts and stores HMIS auth values from Set-Cookie headers
 */
export const createCookieExtractorLink = () =>
  new ApolloLink((operation, forward) => {
    return forward(operation).pipe(
      tap(async () => {
        const setCookieHeader = (
          operation.getContext()['response'] as Response | undefined
        )?.headers.get('set-cookie');

        if (!setCookieHeader) return;

        const domainMatch = setCookieHeader.match(/Domain=([^;,\s]+)/i);
        const authTokenMatch = setCookieHeader.match(
          new RegExp(`${HMIS_AUTH_COOKIE_NAME}=([^;,\\s]+)`, 'i')
        );
        const apiUrlMatch = setCookieHeader.match(
          new RegExp(`${HMIS_API_URL_COOKIE_NAME}=([^;,\\s]+)`, 'i')
        );

        if (!domainMatch?.[1] || !authTokenMatch?.[1]) return;

        const domain = `https://${domainMatch[1].trim()}`;
        storeHmisDomain(domain);

        if (apiUrlMatch?.[1]) {
          storeHmisApiUrl(decodeURIComponent(apiUrlMatch[1]));
        }

        try {
          await storeHmisAuthToken(authTokenMatch[1]);
        } catch (error) {
          console.error('[HMIS] Failed to store auth token:', error);
        }
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
