import 'expo-dev-client';

import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
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
import { ApolloClientProvider } from '@monorepo/ba-platform/expo';
import {
  ApiConfigProvider,
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
import { fetchClient } from './fetchClient';

hideDevMenuFab();

const isDevEnv = process.env['NODE_ENV'] === 'development';
initApolloRuntimeConfig({ isDevEnv: false });

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

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
            <ApiConfigProvider
              apiUrl={apiUrl}
              fetch={fetchClient}
              environments={[
                { name: 'production', url: apiUrl },
                { name: 'demo', url: demoApiUrl },
              ]}
              storage={asyncStorageAdapter}
            >
              <QueryClientProvider client={reactQueryClient}>
                <ApolloClientProvider
                  typePolicies={baApolloTypePolicies}
                  link={
                    new UploadHttpLink({
                      uri: `${apiUrl}/graphql`,
                      fetch: fetchClient,
                    })
                  }
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
            </ApiConfigProvider>
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
