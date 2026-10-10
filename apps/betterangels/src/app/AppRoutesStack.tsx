import {
  getStackModalOptions,
  headerLeftInsetStyle,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { ArrowLeftIcon } from '@monorepo/expo/shared/icons';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

export default function AppRoutesStack() {
  const router = useRouter();
  const modalScreenProps = useModalScreen();

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
        name="modal-screen"
        options={getStackModalOptions({
          ...modalScreenProps,
          onClose: () => router.back(),
        })}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="sign-in"
        options={{
          headerLeft: () => (
            // This screen supplies its own headerLeft, so it needs the same web
            // inset HeaderLeftButton applies. See headerLeftInsetStyle.
            <View style={headerLeftInsetStyle}>
              <IconButton
                onPress={() => router.back()}
                variant="transparent"
                accessibilityLabel="goes to get started screen"
                accessibilityHint="goes to get started screen"
              >
                <ArrowLeftIcon />
              </IconButton>
            </View>
          ),
          headerShadowVisible: false,
          title: '',
        }}
      />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
