import { ApolloProvider } from '@apollo/client';
import { UserProvider } from '@monorepo/expo/betterangels';
import { ArrowLeftIcon, ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import 'expo-dev-client';
import { useFonts } from 'expo-font';
import { Link, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import client from './apollo';
import Logo from './assets/images/logo.svg';

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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();

  return (
    <ApolloProvider client={client}>
      <UserProvider>
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
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="sign-in"
            options={{
              headerTransparent: true,
              headerBackVisible: false,
              headerLeft: () => (
                <IconButton
                  accessibilityHint="goes back to auth screen"
                  accessibilityLabel="Back"
                  style={{ marginLeft: -17 }}
                  variant="transparent"
                  onPress={() => router.back()}
                >
                  <ArrowLeftIcon color={Colors.WHITE} size="sm" />
                </IconButton>
              ),
              headerTitle: () => (
                <View>
                  <Logo color={Colors.WHITE} width={130} height={19.5} />
                </View>
              ),
            }}
          />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
        {/* </ThemeProvider> */}
      </UserProvider>
    </ApolloProvider>
  );
}
