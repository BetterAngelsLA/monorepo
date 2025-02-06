import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { Redirect, Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

export default function PrivateLayout() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Loading size="large" />
      </View>
    );
  }

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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
          ),
        }}
      />
      <Stack.Screen
        name="public-note"
        options={{
          title: 'Note',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => (
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
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
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
          ),
        }}
      />
      <Stack.Screen
        name="edit-client/[id]"
        options={{
          title: 'Edit Client',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => (
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
          ),
        }}
      />
      <Stack.Screen
        name="file/[id]"
        options={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => (
            <TextButton
              regular
              color={Colors.WHITE}
              fontSize="md"
              accessibilityHint="goes to previous screen"
              title="Back"
              onPress={router.back}
            />
          ),
        }}
      />
    </Stack>
  );
}
