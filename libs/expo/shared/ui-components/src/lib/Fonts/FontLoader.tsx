import { useFonts } from 'expo-font';
import { Fragment, ReactNode, useEffect } from 'react';

/**
 * Holds the app back until the app's Poppins faces are ready, so text does not
 * paint in a fallback face and then swap (a flash of unstyled text).
 *
 * That guarantee is only as good as the runtime's font-loading events. On native
 * and in browsers that support them, `useFonts` resolves once the faces have
 * loaded. expo-font's web loader returns immediately where they are unsupported
 * (Safari, iOS WebKit, Edge, IE), so on those a fallback can still paint — this
 * component cannot change that, and a font failure is still not fatal.
 *
 * This used to `throw error` from an effect, which handed the error to the root
 * boundary and replaced the entire app — providers included — with the crash
 * screen, for a problem whose only real consequence is that text renders in the
 * system font. It now logs and continues.
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
