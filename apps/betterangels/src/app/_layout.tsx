import 'expo-dev-client';

import {
  AppUpdatePrompt,
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
import { FeatureControlProvider } from '@monorepo/react/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { type ErrorBoundaryProps } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRoutesStack from './AppRoutesStack';

const isDevEnv = process.env['NODE_ENV'] === 'development';

initApolloRuntimeConfig({
  isDevEnv: false,
});

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

const queryClient = new QueryClient();

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
      <NativePaperProvider>
        <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
          <ApolloClientProvider typePolicies={baApolloTypePolicies}>
            <FeatureControlProvider>
              <KeyboardProvider>
                <KeyboardToolbarProvider>
                  <SnackbarProvider>
                    <UserProvider>
                      <QueryClientProvider client={queryClient}>
                        <BlockingScreenProvider>
                          <ModalScreenProvider>
                            <AppUpdatePrompt />
                            <StatusBar
                              style={Platform.OS === 'ios' ? 'light' : 'auto'}
                            />
                            <AppRoutesStack />
                          </ModalScreenProvider>
                        </BlockingScreenProvider>
                      </QueryClientProvider>
                    </UserProvider>
                  </SnackbarProvider>
                </KeyboardToolbarProvider>
              </KeyboardProvider>
            </FeatureControlProvider>
          </ApolloClientProvider>
        </ApiConfigProvider>
      </NativePaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
