import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { Redirect, Stack, useNavigation } from 'expo-router';
import { Pressable } from 'react-native';

export default function PrivateLayout() {
  const { user } = useUser();
  const navigation = useNavigation();

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
              onPress={navigation.goBack}
            >
              <BodyText color={Colors.WHITE}>Back</BodyText>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="edit-note/[noteId]"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Edit note',
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessible
              accessibilityHint="goes to previous screen"
              onPress={navigation.goBack}
            >
              <BodyText color={Colors.WHITE}>Back</BodyText>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
