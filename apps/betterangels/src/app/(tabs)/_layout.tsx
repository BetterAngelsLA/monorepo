import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Redirect, Tabs } from 'expo-router';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { useUser } from '@monorepo/expo/betterangels';
import {
  CalendarIcon,
  ChartIcon,
  HouseIcon,
  PlusIcon,
} from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
import { StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
        tabBarActiveTintColor: colors.darkBlue,
        tabBarInactiveTintColor: colors.darkGray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Pragmatica-book',
        },
        tabBarStyle: {
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HouseIcon color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
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
          tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
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
            <View style={styles.middleButton}>
              <PlusIcon />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => <ChartIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => (
            <View style={styles.profileContainer}>
              <Text style={styles.profileText}>
                {user.username?.slice(0, 2)}
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    backgroundColor: colors.extraLightBlue,
    height: 24,
    width: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    textTransform: 'uppercase',
    color: colors.white,
    fontFamily: 'Pragmatica-bold',
    fontSize: 11,
  },
  middleButton: {
    height: 66,
    width: 66,
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 6,
  },
});
