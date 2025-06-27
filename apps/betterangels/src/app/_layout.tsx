import 'expo-dev-client';

import {
  AppUpdatePrompt,
  ErrorCrashView,
  FeatureControlProvider,
  FeatureFlagControlled,
  FeatureFlags,
  KeyboardToolbarProvider,
  ModalScreenProvider,
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
    <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
      <ApolloClientProvider>
        <FeatureControlProvider>
          <KeyboardProvider>
            <KeyboardToolbarProvider>
              <UserProvider>
                <SnackbarProvider>
                  <ModalScreenProvider>
                    <StatusBar style="light" />
                    <FeatureFlagControlled
                      flag={FeatureFlags.APP_UPDATE_PROMPT_FF}
                    >
                      <AppUpdatePrompt />
                    </FeatureFlagControlled>
                    {/* All Stack.Screens in AppRoutesStack */}
                    <AppRoutesStack />
                  </ModalScreenProvider>
                </SnackbarProvider>
              </UserProvider>
            </KeyboardToolbarProvider>
          </KeyboardProvider>
        </FeatureControlProvider>
      </ApolloClientProvider>
    </ApiConfigProvider>
  );
}
