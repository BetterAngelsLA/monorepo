import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';

import { useUser } from '@monorepo/expo/betterangels';
import {
  CalendarIcon,
  HouseIcon,
  MapIcon,
  PlusIcon,
  SitemapIcon,
  SolidCalendarIcon,
  SolidHouseIcon,
  SolidMapIcon,
  SolidSitemapIcon,
  SolidUsersIcon,
  UsersIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, FontSizes } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const { user, isLoading } = useUser();
  if (isLoading) return <Text>Loading</Text>;

  if (!user) {
    return <Redirect href="/auth" />;
  }

  // For testing the logout flow case, this has been commented out so the home (/) is available.
  // if (user && !user.hasOrganization) {
  //   // TODO: this part is only for testing and should be changed
  //   return <Redirect href="/welcome" />;
  // }

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.PRIMARY_EXTRA_DARK,
        tabBarInactiveTintColor: Colors.NEUTRAL_DARK,
        tabBarStyle: {
          height: 70 + insets.bottom,
          alignItems: 'center',
          justifyContent: 'center',
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerShadowVisible: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidHouseIcon color={color} />
              ) : (
                <HouseIcon color={color} />
              )}

              <BodyText color={color} size="xs">
                Home
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointment"
        options={{
          href: null,
          title: 'Appointment',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidCalendarIcon color={color} />
              ) : (
                <CalendarIcon color={color} />
              )}
              <BodyText color={color} size="xs">
                Appointment
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidUsersIcon color={color} />
              ) : (
                <UsersIcon color={color} />
              )}
              <BodyText color={color} size="xs">
                Clients
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="drawerPlaceholder"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.wrapper}>
              <View style={styles.middleButton}>
                <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidMapIcon color={color} />
              ) : (
                <MapIcon color={color} />
              )}
              <BodyText color={color} size="xs">
                Map
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          href: null,
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidSitemapIcon color={color} />
              ) : (
                <SitemapIcon color={color} />
              )}
              <BodyText color={color} size="xs">
                Teams
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidCalendarIcon color={color} />
              ) : (
                <CalendarIcon color={color} />
              )}
              <BodyText color={color} size="xs">
                Calendar
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null,
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.profileContainer}>
                <Text style={styles.profileText}>
                  {user.username?.slice(0, 2)}
                </Text>
              </View>
              <BodyText color={color} size="xs">
                Profile
              </BodyText>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    height: 24,
    width: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    textTransform: 'uppercase',
    color: Colors.WHITE,
    fontFamily: 'Pragmatica-bold',
    fontSize: FontSizes.xs.fontSize,
  },
  middleButton: {
    height: 66,
    width: 66,
    borderRadius: 100,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    height: 80,
    width: 80,
    position: 'relative',
    bottom: 36,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
});
