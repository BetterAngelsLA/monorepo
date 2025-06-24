import { useModalScreen } from '@monorepo/expo/betterangels';
import { ArrowLeftIcon } from '@monorepo/expo/shared/icons';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { Stack, useRouter } from 'expo-router';

export function AppRoutesStack() {
  const router = useRouter();
  const { presentation } = useModalScreen();

  return (
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
        name="base-modal-screen"
        key={presentation} // force a re‐mount when presentation changes
        options={{ headerShown: false, presentation }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
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
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
