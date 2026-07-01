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
import { ApolloLink } from '@apollo/client';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import {
  createRefererInterceptor,
  userAgentInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
  createErrorLink,
  loggerLink,
  isReactNativeFileInstance,
} from '@monorepo/expo/shared/clients';
import {
  EnvironmentSwitcherProvider,
  ApolloClientProvider,
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

const fetchClient = createExpoFetchClient(apiUrl, [
  createRefererInterceptor(apiUrl),
  userAgentInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
]);

const httpLink = new UploadHttpLink({
  uri: `${apiUrl}/graphql`,
  fetch: fetchClient,
  isExtractableFile: isReactNativeFileInstance,
});

const apolloLinks = [createErrorLink({ authPath: '/auth' }), httpLink];

if (
  process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true' &&
  process.env['NODE_ENV'] !== 'production'
) {
  apolloLinks.unshift(loggerLink);
}

const link = ApolloLink.from(apolloLinks);

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

export default function RootLayout() {
  useNewRelic();

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <NativePaperProvider>
          <GooglePlacesProvider apiKey={googlePlacesApiKey}>
            <EnvironmentSwitcherProvider
              environments={[
                { name: 'production', url: apiUrl },
                { name: 'demo', url: demoApiUrl },
              ]}
              storage={asyncStorageAdapter}
              fetch={fetch}
            >
              <QueryClientProvider client={reactQueryClient}>
                <ApolloClientProvider
                  typePolicies={baApolloTypePolicies}
                  link={link}
                >
                  <BaFeatureControlProvider>
                    <KeyboardProvider>
                      <KeyboardToolbarProvider>
                        <SnackbarProvider>
                          <UserProvider>
                            <BlockingScreenProvider>
                              <ModalScreenProvider>
                                <AppUpdatePrompt />
                                <StatusBar
                                  style={
                                    Platform.OS === 'ios' ? 'light' : 'auto'
                                  }
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
