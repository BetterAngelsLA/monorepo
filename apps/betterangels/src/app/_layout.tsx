import { UserProvider } from '@monorepo/expo/betterangels';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBM: require('./assets/fonts/IBMPlexSans-Regular.ttf'),
    'IBM-italic': require('./assets/fonts/IBMPlexSans-Italic.ttf'),
    'IBM-bold': require('./assets/fonts/IBMPlexSans-Bold.ttf'),
    'IBM-bold-italic': require('./assets/fonts/IBMPlexSans-BoldItalic.ttf'),
    'IBM-semibold': require('./assets/fonts/IBMPlexSans-SemiBold.ttf'),
    'IBM-semibold-italic': require('./assets/fonts/IBMPlexSans-SemiBoldItalic.ttf'),
    'IBM-medium': require('./assets/fonts/IBMPlexSans-Medium.ttf'),
    'IBM-medium-italic': require('./assets/fonts/IBMPlexSans-MediumItalic.ttf'),
    'IBM-light': require('./assets/fonts/IBMPlexSans-Light.ttf'),
    'IBM-light-italic': require('./assets/fonts/IBMPlexSans-LightItalic.ttf'),
    'IBM-thin': require('./assets/fonts/IBMPlexSans-Thin.ttf'),
    'IBM-thin-italic': require('./assets/fonts/IBMPlexSans-ThinItalic.ttf'),
    'IBM-extra-light': require('./assets/fonts/IBMPlexSans-ExtraLight.ttf'),
    'IBM-extra-light-italic': require('./assets/fonts/IBMPlexSans-ExtraLightItalic.ttf'),
    'Pragmatica-bold': require('./assets/fonts/Pragmatica-Bold.ttf'),
    'Pragmatica-bold-italic': require('./assets/fonts/Pragmatica-BoldOblique.ttf'),
    'Pragmatica-medium': require('./assets/fonts/Pragmatica-Medium.ttf'),
    'Pragmatica-medium-italic': require('./assets/fonts/Pragmatica-MediumOblique.ttf'),
    'Pragmatica-light': require('./assets/fonts/Pragmatica-Light.ttf'),
    'Pragmatica-light-italic': require('./assets/fonts/Pragmatica-LightOblique.ttf'),
    'Pragmatica-extra-light': require('./assets/fonts/Pragmatica-ExtraLight.ttf'),
    'Pragmatica-extra-light-italic': require('./assets/fonts/Pragmatica-ExtraLightOblique.ttf'),
    'Pragmatica-black': require('./assets/fonts/Pragmatica-Black.ttf'),
    'Pragmatica-black-italic': require('./assets/fonts/Pragmatica-BlackOblique.ttf'),
    'Pragmatica-book': require('./assets/fonts/Pragmatica-Book.ttf'),
    'Pragmatica-book-italic': require('./assets/fonts/Pragmatica-BookOblique.ttf'),
    'Pragmatica-extra-bold': require('./assets/fonts/Pragmatica-ExtraBold.ttf'),
    'Pragmatica-extra-bold-italic': require('./assets/fonts/Pragmatica-ExtraBoldOblique.ttf'),
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
          {/* <Stack.Screen name="sign-in" options={{ title: 'sign in' }} /> */}
        </Stack>
      </ThemeProvider>
    </UserProvider>
  );
}
