import 'expo-dev-client';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import {
  ActiveOrgProvider,
  createOrgLink,
} from '@monorepo/ba-platform';
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
  useUser,
} from '@monorepo/expo/betterangels';
import {
  ApiConfigProvider,
  ApolloClientProvider,
  asyncStorageAdapter,
} from '@monorepo/expo/shared/clients';
import {
  BottomSheetModalProvider,
  GooglePlacesProvider,
} from '@monorepo/expo/shared/ui-components';
import { hideDevMenuFab } from '@monorepo/expo/shared/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl, googlePlacesApiKey } from '../../config';
import AppRoutesStack from './AppRoutesStack';

// Hide the expo-dev-menu floating "Tools" FAB on iOS dev clients
// (overlaps `nav-menu-btn`). No-op in production / store builds and on
// Android. See helper for details.
// TODO: Remove once on SDK 56+ — expo-dev-launcher gains a build-time
// plugin option to hide the FAB on both platforms (PR expo/expo#44251).
hideDevMenuFab();

const isDevEnv = process.env['NODE_ENV'] === 'development';

initApolloRuntimeConfig({
  isDevEnv: false,
});

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const orgLink = createOrgLink(asyncStorageAdapter);

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

/** Wraps children with ActiveOrgProvider using the current user's orgs. */
function ActiveOrgWrapper({ children }: { children: ReactNode }) {
  const { user } = useUser();
  return (
    <ActiveOrgProvider organizations={user?.organizations ?? []}>
      {children}
    </ActiveOrgProvider>
  );
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
                <ApolloClientProvider typePolicies={baApolloTypePolicies} links={[orgLink]}>
                  <BaFeatureControlProvider>
                    <KeyboardProvider>
                      <KeyboardToolbarProvider>
                        <SnackbarProvider>
                          <UserProvider>
                            <ActiveOrgWrapper>
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
                            </ActiveOrgWrapper>
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
