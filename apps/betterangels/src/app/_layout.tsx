import 'expo-dev-client';

import {
  FeatureControlProvider,
  KeyboardToolbarProvider,
  SnackbarProvider,
  UserProvider,
} from '@monorepo/expo/betterangels';
import {
  ApiConfigProvider,
  ApolloClientProvider,
} from '@monorepo/expo/shared/clients';
import { ArrowLeftIcon, ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

// Import modules to retrieve version info.
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the native splash screen from auto-hiding.
SplashScreen.preventAutoHideAsync();

// Define the props for DebugOverlay.
interface DebugOverlayProps {
  error?: Error | null;
}

/**
 * DebugOverlay displays debug information (app version, runtime version, OTA version,
 * and any error) as an overlay that remains visible on top of your app.
 * The overlay is positioned at the top with a white background.
 */
function DebugOverlay({ error }: DebugOverlayProps) {
  const appVersion = Application.nativeApplicationVersion ?? 'unknown';
  const runtimeVersion = Updates.runtimeVersion ?? 'unknown';
  const otaVersion = Updates.updateId ?? 'N/A';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 10,
        zIndex: 1000,
      }}
    >
      <TextRegular style={{ color: 'black' }}>
        App Version: {appVersion}
      </TextRegular>
      <TextRegular style={{ color: 'black' }}>
        Runtime Version: {runtimeVersion}
      </TextRegular>
      <TextRegular style={{ color: 'black' }}>
        OTA Version: {otaVersion}
      </TextRegular>
      {error && (
        <TextRegular style={{ color: 'red' }}>
          Error: {error.message}
        </TextRegular>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    // Once fonts are loaded or an error occurs, hide the native splash screen.
    // if (loaded || error) {
    SplashScreen.hideAsync();
  }, []);

  // useEffect(() => {
  //   // Once fonts are loaded or an error occurs, hide the native splash screen.
  //   if (loaded || error) {
  //     SplashScreen.hideAsync();
  //     if (error) {
  //       console.warn(`Error loading fonts: ${error}`);
  //     }
  //   }
  // }, [loaded, error]);

  // While fonts are still loading (and no error has occurred), show nothing.
  // if (!loaded && !error) {
  //   return null;
  // }

  return (
    <View style={{ flex: 1 }}>
      <RootLayoutNav />
      <DebugOverlay error={error} />
    </View>
  );
}

function RootLayoutNav() {
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
                      name="team"
                      options={{
                        title: '',
                        presentation: 'modal',
                        headerLeft: () => (
                          <Link href="/teams">
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <ChevronLeftIcon color={Colors.PRIMARY_LIGHT} />
                              <TextRegular color={Colors.PRIMARY_LIGHT}>
                                Teams
                              </TextRegular>
                            </View>
                          </Link>
                        ),
                      }}
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
