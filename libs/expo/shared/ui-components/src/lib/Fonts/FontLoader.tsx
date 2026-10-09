import { useFonts } from 'expo-font';
import { Fragment, ReactNode, useEffect } from 'react';

/**
 * Waits for the app's Poppins faces before rendering, so text never paints in a
 * fallback face and then swaps (a flash of unstyled text).
 *
 * A font failure is *not* fatal. This used to `throw error` from an effect, which
 * handed the error to the root boundary and replaced the entire app — providers
 * included — with the crash screen, for a problem whose only real consequence is
 * that text renders in the system font. It now logs and continues.
 *
 * The `!loaded && !error` guard is what keeps that from becoming an eternal blank
 * screen: on the error path we stop waiting and render the app anyway.
 */
export default function FontLoader({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts({
    'Poppins-Medium': require('./fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('./fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.error(
        'Fonts failed to load; continuing with the system font.',
        error,
      );
    }
  }, [error]);

  if (!loaded && !error) return null;

  return <Fragment>{children}</Fragment>;
}
