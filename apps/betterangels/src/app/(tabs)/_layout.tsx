import { Redirect, Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MainPlusModal, hexToRGBA, useUser } from '@monorepo/expo/betterangels';
import {
  CalendarLineIcon,
  CalendarSolidIcon,
  HouseLineIcon,
  HouseSolidIcon,
  MapLineIcon,
  MapSolidIcon,
  PlusIcon,
  SitemapLineIcon,
  SitemapSolidIcon,
  UsersLineIcon,
  UsersSolidIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, FontSizes } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const { user, isLoading } = useUser();

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

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
    <>
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
            headerStyle: {
              backgroundColor: Colors.BRAND_DARK_BLUE,
            },
            headerShadowVisible: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ? (
                  <HouseSolidIcon color={color} />
                ) : (
                  <HouseLineIcon color={color} />
                )}

                <TextRegular color={color} size="xs">
                  Home
                </TextRegular>
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
                  <CalendarSolidIcon color={color} />
                ) : (
                  <CalendarLineIcon color={color} />
                )}
                <TextRegular color={color} size="xs">
                  Appointment
                </TextRegular>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="drawerPlaceholder"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openModal();
            },
          }}
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.wrapper}>
                <View style={styles.middleButton}>
                  <PlusIcon color={Colors.WHITE} />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="clients"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate({
                pathname: 'clients',
                params: {
                  title: '',
                  select: 'false',
                },
              });
            },
          }}
          options={{
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: Colors.BRAND_DARK_BLUE,
            },
            title: '',
            tabBarIcon: ({ focused, color }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ? (
                  <UsersSolidIcon color={color} />
                ) : (
                  <UsersLineIcon color={color} />
                )}
                <TextRegular color={color} size="xs">
                  All Clients
                </TextRegular>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            href: null,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ? (
                  <MapSolidIcon color={color} />
                ) : (
                  <MapLineIcon color={color} />
                )}
                <TextRegular color={color} size="xs">
                  Map
                </TextRegular>
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
                  <SitemapSolidIcon color={color} />
                ) : (
                  <SitemapLineIcon color={color} />
                )}
                <TextRegular color={color} size="xs">
                  Teams
                </TextRegular>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            href: null,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused ? (
                  <CalendarSolidIcon color={color} />
                ) : (
                  <CalendarLineIcon color={color} />
                )}
                <TextRegular color={color} size="xs">
                  Calendar
                </TextRegular>
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
                <TextRegular color={color} size="xs">
                  Profile
                </TextRegular>
              </View>
            ),
          }}
        />
      </Tabs>
      <MainPlusModal closeModal={closeModal} isModalVisible={isModalVisible} />
    </>
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
    fontFamily: 'Poppins-Regular',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: hexToRGBA(Colors.SECONDARY_EXTRA_DARK, 0.97),
  },
});
