import 'expo-dev-client';

import {
  AppUpdatePrompt,
  BlockingScreenProvider,
  createBaTypePolicies,
  ErrorCrashView,
  handleSessionExpired,
  KeyboardToolbarProvider,
  ModalScreenProvider,
  NativePaperProvider,
  SnackbarProvider,
  useNewRelic,
  useSnackbar,
  UserProvider,
} from '@monorepo/expo/betterangels';
import {
  ApiConfigProvider,
  ApolloClientProvider,
  SessionManagerProvider,
} from '@monorepo/expo/shared/clients';
import { FeatureControlProvider } from '@monorepo/react/shared';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { type ErrorBoundaryProps } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRoutesStack from './AppRoutesStack';

const isDevEnv = process.env['NODE_ENV'] === 'development';

initApolloRuntimeConfig({
  isDevEnv: false,
});

const baApolloTypePolicies = createBaTypePolicies(isDevEnv);

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
          <SessionManagerProvider />
          <KeyboardProvider>
            <KeyboardToolbarProvider>
              <SnackbarProvider>
                <AppProviders />
              </SnackbarProvider>
            </KeyboardToolbarProvider>
          </KeyboardProvider>
        </ApiConfigProvider>
      </NativePaperProvider>
    </GestureHandlerRootView>
  );
}

function AppProviders() {
  const { showSnackbar } = useSnackbar();

  const handleUnauthenticated = () => {
    handleSessionExpired(showSnackbar);
  };

  return (
    <ApolloClientProvider
      typePolicies={baApolloTypePolicies}
      onUnauthenticated={handleUnauthenticated}
    >
      <FeatureControlProvider>
        <UserProvider>
          <BlockingScreenProvider>
            <ModalScreenProvider>
              <AppUpdatePrompt />
              <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
              <AppRoutesStack />
            </ModalScreenProvider>
          </BlockingScreenProvider>
        </UserProvider>
      </FeatureControlProvider>
    </ApolloClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
