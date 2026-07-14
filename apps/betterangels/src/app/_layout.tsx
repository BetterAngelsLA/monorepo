import 'expo-dev-client';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import {
  AppUpdatePrompt,
  BaFeatureControlProvider,
  BlockingScreenProvider,
  createBaTypePolicies,
  ErrorCrashView,
  KeyboardToolbarProvider,
  ModalScreenProvider,
  NativePaperProvider,
  SnackbarProvider,
  useNewRelic,
  UserProvider,
} from '@monorepo/expo/betterangels';
import { ApolloLink, HttpLink } from '@apollo/client';
import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import {
  createRefererInterceptor,
  userAgentInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
  createErrorLink,
  loggerLink,
} from '@monorepo/expo/shared/clients';
import {
  EnvironmentSwitcherProvider,
  ApolloClientProvider,
  getGraphqlUrl,
  useApiConfig,
} from '@monorepo/ba-platform';
import {
  BottomSheetModalProvider,
  GooglePlacesProvider,
} from '@monorepo/expo/shared/ui-components';
import { hideDevMenuFab, asyncStorageAdapter } from '@monorepo/expo/shared/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl, googlePlacesApiKey } from '../../config';
import AppRoutesStack from './AppRoutesStack';

hideDevMenuFab();

const isDevEnv = process.env['NODE_ENV'] === 'development';
initApolloRuntimeConfig({ isDevEnv: false });

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

// ---------------------------------------------------------------------------
// Interceptor factory — shared by REST (env-switcher fetch) and Apollo link.
// Called with the resolved ``apiUrl`` whenever the environment changes.
// ---------------------------------------------------------------------------
const buildExpoInterceptors = (apiUrl: string) =>
  createExpoFetchClient(apiUrl, [
    createRefererInterceptor(apiUrl),
    userAgentInterceptor,
    hmisAuthInterceptor,
    interceptorHmis,
  ]);

const isGqlDebug =
  process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true' &&
  process.env['NODE_ENV'] !== 'production';

// ---------------------------------------------------------------------------
// Inner layout — lives inside ``EnvironmentSwitcherProvider`` so it has
// access to the env-aware ``apiUrl`` and ``fetch`` via ``useApiConfig()``.
// ---------------------------------------------------------------------------
function InnerLayout() {
  const { apiUrl, fetch: authFetch } = useApiConfig();

  const link = useMemo(() => {
    const httpLink = new HttpLink({
      uri: getGraphqlUrl(apiUrl),
      fetch: authFetch,
    });
    const links = [createErrorLink({ authPath: '/auth' }), httpLink];
    if (isGqlDebug) links.unshift(loggerLink);
    return ApolloLink.from(links);
  }, [apiUrl, authFetch]);

  return (
    <QueryClientProvider client={reactQueryClient}>
      <ApolloClientProvider typePolicies={baApolloTypePolicies} link={link}>
        <BaFeatureControlProvider>
          <KeyboardProvider>
            <KeyboardToolbarProvider>
              <SnackbarProvider>
                <UserProvider>
                  <BlockingScreenProvider>
                    <ModalScreenProvider>
                      <AppUpdatePrompt />
                      <StatusBar
                        style={Platform.OS === 'ios' ? 'light' : 'auto'}
                      />
                      <AppRoutesStack />
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

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

const ENVIRONMENTS = [
  { name: 'production' as const, url: apiUrl },
  { name: 'demo' as const, url: demoApiUrl },
];

export default function RootLayout() {
  useNewRelic();

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <NativePaperProvider>
          <GooglePlacesProvider apiKey={googlePlacesApiKey}>
            <EnvironmentSwitcherProvider
              environments={ENVIRONMENTS}
              storage={asyncStorageAdapter}
              createFetch={buildExpoInterceptors}
            >
              <InnerLayout />
            </EnvironmentSwitcherProvider>
          </GooglePlacesProvider>
        </NativePaperProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
