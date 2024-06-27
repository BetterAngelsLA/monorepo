import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { Redirect, Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function PrivateLayout() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) return <Text>Loading</Text>;

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
        name="add-note/[noteId]"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Add interaction',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="interactions"
        options={{
          title: 'Interactions',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="note/[id]"
        options={{
          title: 'Interaction',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="client/[id]"
        options={{
          title: 'Client',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="public-note"
        options={{
          title: 'Public Note',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
       <Stack.Screen
        name="add-client"
        options={{
          title: 'Add Client',
          headerTitleAlign: 'center',
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
              <TextRegular color={Colors.WHITE}>Back</TextRegular>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
