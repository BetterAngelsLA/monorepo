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
import {
  ApiConfigProvider,
  ApolloClientProvider,
} from '@monorepo/expo/shared/clients';
import {
  BottomSheetModalProvider,
  GooglePlacesProvider,
} from '@monorepo/expo/shared/ui-components';
import { TPlatformHeaders } from '@monorepo/shared/places';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';
import { getSigningFingerprint } from '../../modules/signing-fingerprint';
import AppRoutesStack from './AppRoutesStack';

const isDevEnv = process.env['NODE_ENV'] === 'development';

initApolloRuntimeConfig({
  isDevEnv: false,
});

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const reactqQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // need custom implementation for React Native
    },
  },
});

const platformHeaders: TPlatformHeaders =
  Platform.OS === 'ios'
    ? { iosBundleId: Application.applicationId ?? undefined }
    : {
        androidPackage: Application.applicationId ?? undefined,
        androidCertFingerprint: getSigningFingerprint() ?? undefined,
      };

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Render Error page on uncaught error
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

export default function RootLayout() {
  useNewRelic();

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <NativePaperProvider>
          <GooglePlacesProvider platformHeaders={platformHeaders}>
            <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
              <QueryClientProvider client={reactqQueryClient}>
                <ApolloClientProvider typePolicies={baApolloTypePolicies}>
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
