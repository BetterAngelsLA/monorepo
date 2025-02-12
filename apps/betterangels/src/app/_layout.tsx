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
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { apiUrl, demoApiUrl } from '../../config';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      if (error) {
        console.warn(`Error in loading fonts: ${error}`);
      }
    }
  }, [loaded, error]);

  // Return nothing until fonts are loaded (or an error occurs)
  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
    </ThemeProvider>
  );
}
