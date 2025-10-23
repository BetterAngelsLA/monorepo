import {
  getDefaultStackNavOptions,
  useUser,
} from '@monorepo/expo/betterangels';
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
        name="clients/create"
        options={getDefaultStackNavOptions({
          title: 'Create Client Profile',
        })}
      />
      <Stack.Screen
        name="clients/[id]/edit"
        options={getDefaultStackNavOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/add"
        options={getDefaultStackNavOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/[relationId]/edit"
        options={getDefaultStackNavOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/index"
        options={getDefaultStackNavOptions()}
      />
      <Stack.Screen
        name="notes-hmis/index"
        options={getDefaultStackNavOptions({
          title: 'Interactions',
        })}
      />
      <Stack.Screen
        name="notes-hmis/create/index"
        options={getDefaultStackNavOptions({
          title: 'Add Interaction',
        })}
      />
      <Stack.Screen
        name="notes-hmis/[id]/index"
        options={getDefaultStackNavOptions({
          title: 'Interaction',
        })}
      />
      <Stack.Screen
        name="notes-hmis/[id]/edit"
        options={getDefaultStackNavOptions({
          title: 'Edit Interaction',
        })}
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
      <Stack.Screen
        name="settings/index"
        options={getDefaultStackNavOptions({
          title: 'Settings',
        })}
      />
      <Stack.Screen
        name="settings/about/index"
        options={getDefaultStackNavOptions({
          title: 'About App',
        })}
      />
      <Stack.Screen
        name="tasks"
        options={getDefaultStackNavOptions({
          title: 'Tasks',
        })}
      />

      <Stack.Screen
        name="task/[id]"
        options={getDefaultStackNavOptions({
          title: 'Task',
        })}
      />
    </Stack>
  );
}
