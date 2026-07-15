import { ApolloLink, HttpLink } from '@apollo/client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import {
  ApolloClientProvider,
  getGraphqlUrl,
  useApiConfig,
} from '@monorepo/ba-platform';
import {
  BaFeatureControlProvider,
  BlockingScreenProvider,
  KeyboardToolbarProvider,
  ModalScreenProvider,
  SnackbarProvider,
  UserProvider,
} from '@monorepo/expo/betterangels';
import { createErrorLink, loggerLink } from '@monorepo/expo/shared/clients';

import { baTypePolicies, isGqlDebug, reactQueryClient } from '../init';

/**
 * Data + auth providers — lives inside ``EnvironmentSwitcherProvider``
 * so it has access to the env-aware ``apiUrl`` and ``rawFetch`` via
 * ``useApiConfig()``.  Rebuilds the Apollo link chain when the
 * environment changes.
 */
export function BaDataProviders({ children }: { children: ReactNode }) {
  const { apiUrl, rawFetch } = useApiConfig();

  const link = useMemo(() => {
    const httpLink = new HttpLink({
      uri: getGraphqlUrl(apiUrl),
      fetch: rawFetch,
    });
    const links = [createErrorLink({ authPath: '/auth' }), httpLink];
    if (isGqlDebug) links.unshift(loggerLink);
    return ApolloLink.from(links);
  }, [apiUrl, rawFetch]);

  return (
    <QueryClientProvider client={reactQueryClient}>
      <ApolloClientProvider typePolicies={baTypePolicies} link={link}>
        <BaFeatureControlProvider>
          <KeyboardProvider>
            <KeyboardToolbarProvider>
              <SnackbarProvider>
                <UserProvider>
                  <BlockingScreenProvider>
                    <ModalScreenProvider>
                      {children}
                    </ModalScreenProvider>
                  </BlockingScreenProvider>
                </UserProvider>
              </SnackbarProvider>
            </KeyboardToolbarProvider>
          </KeyboardProvider>
        </BaFeatureControlProvider>
      </ApolloClientProvider>
    </QueryClientProvider>
  );
}
