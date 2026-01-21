import { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { Observable } from '@apollo/client/utilities';
import { getHmisAuthToken, storeHmisDomain } from '@monorepo/expo/shared/utils';
import { Kind, type OperationDefinitionNode } from 'graphql';
import NitroCookies from 'react-native-nitro-cookies';
import { MODERN_BROWSER_USER_AGENT } from '../../common/constants';
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
    /(?:^|[;\s])auth_token=([^;,\s]+)/i
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
        ...(authToken ? { 'x-hmis-token': authToken } : {}),
      },
    };
  });

/**
 * Extracts and stores cookies from responses
 */
export const createCookieExtractorLink = () =>
  new ApolloLink(
    (operation, forward) =>
      new Observable((observer) => {
        const subscription = forward(operation).subscribe({
          next: (response) => {
            observer.next(response);

            const setCookieHeader = (
              operation.getContext()['response'] as Response | undefined
            )?.headers.get('set-cookie');

            const parsed = setCookieHeader
              ? parseHmisCookieHeader(setCookieHeader)
              : null;
            if (parsed) {
              if (parsed.authToken && __DEV__) {
                console.debug(
                  '[HMIS] Auth token cookie updated for domain:',
                  parsed.domain
                );
              }

              // Store the HMIS domain for later use in getHmisAuthToken
              storeHmisDomain(parsed.domain);
              NitroCookies.setFromResponse(
                parsed.domain,
                setCookieHeader as string
              ).catch((error: Error) =>
                console.error('[HMIS] Failed to store cookies:', error)
              );
            }
          },
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });

        return () => subscription.unsubscribe();
      })
  );

/**
 * Apollo link that handles HMIS authentication and cookie management.
 * Automatically detects HMIS operations based on @hmisDirective in the schema.
 */
export const createHmisAuthLink = (): ApolloLink => {
  const authAndCookieLink = createCookieExtractorLink().concat(
    createAuthHeaderLink()
  );

  return new ApolloLink((operation, forward) => {
    const operationDef = operation.query.definitions.find(
      (def: any) =>
        def.kind === Kind.OPERATION_DEFINITION &&
        def.name?.value === operation.operationName
    ) as OperationDefinitionNode | undefined;
    const isHmisOperation = operationHasDirective(
      operationDef,
      'hmisDirective'
    );

    if (!isHmisOperation) {
      return forward(operation);
    }

    return authAndCookieLink.request(operation, forward);
  });
};
