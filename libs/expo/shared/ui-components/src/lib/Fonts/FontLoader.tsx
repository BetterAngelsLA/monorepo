import { useFonts } from 'expo-font';
import { Fragment, ReactNode, useEffect } from 'react';

export default function FontLoader({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts({
    'Posspins-Medium': require('./fonts/Poppins-Medium.ttf'),
    'Posspins-Regular': require('./fonts/Poppins-Regular.ttf'),
    'Posspins-SemiBold': require('./fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <Fragment>{children}</Fragment>;
}
