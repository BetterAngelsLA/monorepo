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
import { BottomSheetModalProvider } from '@monorepo/expo/shared/ui-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';
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
          </ApiConfigProvider>
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
