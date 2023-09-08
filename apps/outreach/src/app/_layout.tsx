import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import UserProvider from '../libs/providers/user/UserProvider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
GoogleSignin.configure({
  webClientId:
    '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com',
  iosClientId:
    '488261458560-rn7oe3rklvuqps03bndepp3v5g2goegb.apps.googleusercontent.com',
  offlineAccess: true,
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
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
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </UserProvider>
  );
}
