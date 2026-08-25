import {
  getStackScreenOptions,
  HeaderLeftButton,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function PrivateLayout() {
  const { user, isLoading } = useUser();

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
        name="note/create"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Add interaction',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="note/[id]/edit"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Edit interaction',
          headerTitleAlign: 'center',
        }}
      />

      <Stack.Screen
        name="note/[id]/index"
        options={{
          title: 'Interaction',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => <HeaderLeftButton />,
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
          headerLeft: () => <HeaderLeftButton />,
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
          headerLeft: () => <HeaderLeftButton />,
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
          headerLeft: () => <HeaderLeftButton />,
        }}
      />
      <Stack.Screen
        name="clients/create"
        options={getStackScreenOptions({
          title: 'Create Client Profile',
        })}
      />
      <Stack.Screen
        name="clients/[id]/edit"
        options={getStackScreenOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/add"
        options={getStackScreenOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/[relationId]/edit"
        options={getStackScreenOptions()}
      />
      <Stack.Screen
        name="clients/[id]/relations/index"
        options={getStackScreenOptions()}
      />
      <Stack.Screen
        name="notes-hmis/index"
        options={getStackScreenOptions({
          title: 'Notes',
        })}
      />
      <Stack.Screen
        name="user-profile/edit"
        options={{
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          title: 'Edit Profile',
          headerTitleAlign: 'center',
          headerLeft: () => <HeaderLeftButton />,
        }}
      />
      <Stack.Screen
        name="notes-hmis/create/index"
        options={getStackScreenOptions({
          title: 'Add Note',
        })}
      />
      <Stack.Screen
        name="notes-hmis/[id]/index"
        options={getStackScreenOptions({
          title: 'Note',
        })}
      />
      <Stack.Screen
        name="notes-hmis/[id]/edit"
        options={getStackScreenOptions({
          title: 'Edit Note',
        })}
      />
      <Stack.Screen
        name="file/[id]"
        options={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => <HeaderLeftButton />,
        }}
      />
      <Stack.Screen
        name="hmis-file/[id]"
        options={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: Colors.BRAND_DARK_BLUE,
          },
          headerLeft: () => <HeaderLeftButton />,
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={getStackScreenOptions({
          title: 'Settings',
        })}
      />
      <Stack.Screen
        name="settings/about/index"
        options={getStackScreenOptions({
          title: 'About App',
        })}
      />
      <Stack.Screen
        name="settings/hmis-rest"
        options={getStackScreenOptions({
          title: 'HMIS REST (dev)',
        })}
      />
      <Stack.Screen
        name="settings/team/index"
        options={getStackScreenOptions({
          title: 'Select Default Team',
        })}
      />
      <Stack.Screen
        name="settings/location/index"
        options={getStackScreenOptions({
          title: 'Select Default Location',
        })}
      />
      <Stack.Screen
        name="tasks"
        options={getStackScreenOptions({
          title: 'Tasks',
        })}
      />

      <Stack.Screen
        name="task/[id]"
        options={getStackScreenOptions({
          title: 'Task',
        })}
      />
    </Stack>
  );
}
