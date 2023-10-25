import { useUser } from '@monorepo/expo/betterangels';
import { Redirect, Stack } from 'expo-router';

export default function PrivateLayout() {
  const { user } = useUser();

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
}
