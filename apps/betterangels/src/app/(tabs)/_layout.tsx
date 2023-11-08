import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Redirect, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useUser } from '@monorepo/expo/betterangels';
import {
  CalendarIcon,
  HouseIcon,
  PlusIcon,
  SitemapIcon,
  SolidCalendarIcon,
  SolidHouseIcon,
  SolidSitemapIcon,
} from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
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
        tabBarActiveTintColor: Colors.DARK_BLUE,
        tabBarInactiveTintColor: Colors.DARK_GRAY,
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidHouseIcon color={color} />
              ) : (
                <HouseIcon color={color} />
              )}

              <BodyText color={color} fontSize="xs">
                Home
              </BodyText>
            </View>
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color="black"
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="appointment"
        options={{
          title: 'Appointment',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidCalendarIcon color={color} />
              ) : (
                <CalendarIcon color={color} />
              )}
              <BodyText color={color} fontSize="xs">
                Appointment
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
                <PlusIcon />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused ? (
                <SolidSitemapIcon color={color} />
              ) : (
                <SitemapIcon color={color} />
              )}
              <BodyText color={color} fontSize="xs">
                Teams
              </BodyText>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.profileContainer}>
                <Text style={styles.profileText}>
                  {user.username?.slice(0, 2)}
                </Text>
              </View>
              <BodyText color={color} fontSize="xs">
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
    backgroundColor: Colors.EXTRA_LIGHT_BLUE,
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
    fontSize: 11,
  },
  middleButton: {
    height: 66,
    width: 66,
    borderRadius: 100,
    backgroundColor: Colors.BLUE,
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
