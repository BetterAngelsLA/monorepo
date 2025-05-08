import 'expo-dev-client';

import {
  AppUpdatePrompt,
  ErrorCrashView,
  FeatureControlProvider,
  FeatureFlagControlled,
  FeatureFlags,
  KeyboardToolbarProvider,
  SnackbarProvider,
  UserProvider,
} from '@monorepo/expo/betterangels';
import {
  ApiConfigProvider,
  ApolloClientProvider,
} from '@monorepo/expo/shared/clients';
import { ArrowLeftIcon } from '@monorepo/expo/shared/icons';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

import { type ErrorBoundaryProps } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Render Error page on uncaught error
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorCrashView {...props} />;
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <ApiConfigProvider productionUrl={apiUrl} demoUrl={demoApiUrl}>
      <ApolloClientProvider>
        <FeatureControlProvider>
          <KeyboardProvider>
            <KeyboardToolbarProvider>
              <UserProvider>
                <SnackbarProvider>
                  <StatusBar style="light" />
                  <FeatureFlagControlled
                    flag={FeatureFlags.APP_UPDATE_PROMPT_FF}
                  >
                    <AppUpdatePrompt />
                  </FeatureFlagControlled>
                  <Stack>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="(private-screens)"
                      options={{ headerShown: false, gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                      name="sign-in"
                      options={{
                        headerLeft: () => (
                          <IconButton
                            onPress={() => router.back()}
                            variant="transparent"
                            accessibilityLabel="goes to get started screen"
                            accessibilityHint="goes to get started screen"
                          >
                            <ArrowLeftIcon />
                          </IconButton>
                        ),
                        headerShadowVisible: false,
                        title: '',
                      }}
                    />
                    <Stack.Screen
                      name="auth"
                      options={{ headerShown: false }}
                    />
                  </Stack>
                </SnackbarProvider>
              </UserProvider>
            </KeyboardToolbarProvider>
          </KeyboardProvider>
        </FeatureControlProvider>
      </ApolloClientProvider>
    </ApiConfigProvider>
  );
}
