import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function PrivateLayout() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          color: Colors.WHITE,
        },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-note/[clientId]"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Add note',
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessible
              accessibilityHint="goes to previous screen"
              onPress={router.back}
            >
              <BodyText color={Colors.WHITE}>Back</BodyText>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="form/index"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessible
              accessibilityHint="goes to previous screen"
              onPress={router.back}
            >
              <BodyText color={Colors.WHITE}>Back</BodyText>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
