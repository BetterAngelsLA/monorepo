import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  getHmisAuthToken,
  HMIS_AUTH_COOKIE_NAME,
  storeHmisDomain,
} from '@monorepo/expo/shared/utils';
import { Kind, type OperationDefinitionNode } from 'graphql';
import NitroCookies from 'react-native-nitro-cookies';
import { tap } from 'rxjs';
import {
  HMIS_DIRECTIVE_NAME,
  HMIS_TOKEN_HEADER_NAME,
  MODERN_BROWSER_USER_AGENT,
} from '../../common/constants';
import { operationHasDirective } from '../utils/schemaDirectives';

export const parseHmisCookieHeader = (
  setCookieHeader: string
): { domain: string; authToken?: string } | null => {
  if (!setCookieHeader.length) {
    return null;
  }

  const domainMatch = setCookieHeader.match(/Domain=([^;,\s]+)/i);
  if (!domainMatch?.[1]) {
    return null;
  }

  const rawDomain = domainMatch[1].trim();
  const domain = `https://${rawDomain}`;

  const authTokenMatch = setCookieHeader.match(
    new RegExp(`${HMIS_AUTH_COOKIE_NAME}=([^;,\\s]+)`, 'i')
  );
  const authToken = authTokenMatch?.[1];

  return { domain, authToken };
};

/**
 * Adds X-HMIS-Token header and sets a browser User-Agent
 * (HMIS requires a browser User-Agent, not the native app's User-Agent)
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
 * Extracts and stores cookies from responses
 */
export const createCookieExtractorLink = () =>
  new ApolloLink((operation, forward) => {
    return forward(operation).pipe(
      tap(() => {
        const setCookieHeader = (
          operation.getContext()['response'] as Response | undefined
        )?.headers.get('set-cookie');

        if (!setCookieHeader) {
          return;
        }

        const parsed = parseHmisCookieHeader(setCookieHeader);
        if (!parsed) {
          return;
        }

        // Only store domain when auth token is present to avoid overwriting with non-HMIS cookies
        if (parsed.authToken) {
          storeHmisDomain(parsed.domain);

          if (__DEV__) {
            console.debug('[HMIS] Auth token cookie updated:', {
              domain: parsed.domain,
            });
          }
        }
        NitroCookies.setFromResponse(parsed.domain, setCookieHeader).catch(
          (error: Error) =>
            console.error('[HMIS] Failed to store cookies:', error)
        );
      })
    );
  });

/**
 * Apollo link that handles HMIS authentication and cookie management.
 * Automatically detects HMIS operations based on @hmisDirective in the schema.
 *
 * Uses ApolloLink.split() to route operations:
 * - HMIS operations (with @hmisDirective): apply auth headers and extract cookies
 * - Non-HMIS operations: pass through unchanged (falseLink is undefined)
 */
export const createHmisAuthLink = (): ApolloLink => {
  const authAndCookieLink = createCookieExtractorLink().concat(
    createAuthHeaderLink()
  );

  return ApolloLink.split(
    (operation) => {
      const operationDef = operation.query.definitions.find(
        (def): def is OperationDefinitionNode =>
          def.kind === Kind.OPERATION_DEFINITION &&
          def.name?.value === operation.operationName
      );
      return operationHasDirective(operationDef, HMIS_DIRECTIVE_NAME);
    },
    authAndCookieLink
    // falseLink is undefined, so non-HMIS operations pass through unchanged
  );
};
