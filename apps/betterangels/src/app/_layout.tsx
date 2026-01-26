import 'expo-dev-client';

import {
  AppUpdatePrompt,
  baApolloTypePolicies,
  BlockingScreenProvider,
  ErrorCrashView,
  FeatureControlProvider,
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
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

import { type ErrorBoundaryProps } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRoutesStack from './AppRoutesStack';

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
