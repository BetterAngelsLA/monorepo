import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Redirect, Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

type TGetDefaultNavOptions = {
  title?: string;
};

function getDefaultNavOptions(
  props?: TGetDefaultNavOptions
): NativeStackNavigationOptions {
  const { title } = props || {};

  const router = useRouter();

  return {
    headerTitleAlign: 'center',
    title: title || '',
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
  };
}

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
        name="clients/create"
        options={getDefaultNavOptions({
          title: 'Create Client Profile',
        })}
      />
      <Stack.Screen name="clients/[id]/edit" options={getDefaultNavOptions()} />
      <Stack.Screen
        name="clients/[id]/relations/add"
        options={getDefaultNavOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/[relationId]/edit"
        options={getDefaultNavOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/index"
        options={getDefaultNavOptions()}
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
        options={getDefaultNavOptions({
          title: 'Settings',
        })}
      />
      <Stack.Screen
        name="settings/about/index"
        options={getDefaultNavOptions({
          title: 'About App',
        })}
      />
    </Stack>
  );
}
