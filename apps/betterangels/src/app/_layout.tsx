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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl, googlePlacesApiKey } from '../../config';
import AppRoutesStack from './AppRoutesStack';

// Disable the expo-dev-menu floating action button (the "tools" FAB in the
// top-right) so it doesn't overlap the in-app `nav-menu-btn` during e2e
// runs on fresh installs. `requireOptionalNativeModule` returns undefined
// in production builds (where expo-dev-menu isn't bundled), so the optional
// chain makes this a no-op there. The setting is persisted in the dev-menu
// preferences store after the first call. See:
// https://stackoverflow.com/a/79908585

const DevMenuPreferences = requireOptionalNativeModule<{
  setPreferencesAsync: (prefs: {
    showFloatingActionButton?: boolean;
  }) => Promise<void>;
}>('DevMenuPreferences');

DevMenuPreferences?.setPreferencesAsync({
  // showFloatingActionButton: true,
  showFloatingActionButton: false,
});

const isDevEnv = process.env['NODE_ENV'] === 'development';

initApolloRuntimeConfig({
  isDevEnv: false,
});

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // need custom implementation for React Native
    },
  },
});

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
          <GooglePlacesProvider apiKey={googlePlacesApiKey}>
            <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
              <QueryClientProvider client={reactQueryClient}>
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
