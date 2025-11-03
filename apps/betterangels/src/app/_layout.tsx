import 'expo-dev-client';

import {
  AppUpdatePrompt,
  BlockingScreenProvider,
  cachePolicyRegistry,
  ErrorCrashView,
  FeatureControlProvider,
  FeatureFlagControlled,
  FeatureFlags,
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
} from '@monorepo/expo/shared/clients';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

import CookieManager from '@react-native-cookies/cookies';
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
  const { setUser } = useUser();

  const handleUnauthenticated = async () => {
    try {
      // wipe session cookies so subsequent requests are truly unauthenticated
      await CookieManager.clearAll();
    } finally {
      // reset local user state and take user to Auth
      setUser(undefined);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <NativePaperProvider>
        <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
          <ApolloClientProvider
            policyConfig={cachePolicyRegistry}
            onUnauthenticated={handleUnauthenticated}
          >
            <FeatureControlProvider>
              <KeyboardProvider>
                <KeyboardToolbarProvider>
                  <UserProvider>
                    <BlockingScreenProvider>
                      <SnackbarProvider>
                        <ModalScreenProvider>
                          <FeatureFlagControlled
                            flag={FeatureFlags.APP_UPDATE_PROMPT_FF}
                          >
                            <AppUpdatePrompt />
                            <StatusBar
                              style={Platform.OS === 'ios' ? 'light' : 'auto'}
                            />
                          </FeatureFlagControlled>
                          {/* All Stack.Screens in AppRoutesStack */}
                          <AppRoutesStack />
                        </ModalScreenProvider>
                      </SnackbarProvider>
                    </BlockingScreenProvider>
                  </UserProvider>
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
