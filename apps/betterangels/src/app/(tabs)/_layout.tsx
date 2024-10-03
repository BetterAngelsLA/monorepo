import { Redirect, Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ConsentModal,
  MainPlusModal,
  useUser,
} from '@monorepo/expo/betterangels';
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
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../../config';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setModalVisible] = useState(false);
  const [tosModalIsOpen, setTosModalIsOpen] = useState<boolean>(false);
  const router = useRouter();

  const { user, isLoading } = useUser();

  useEffect(() => {
    if (user && (!user.hasAcceptedTos || !user.hasAcceptedPrivacyPolicy)) {
      setTosModalIsOpen(true);
    }
  }, [user]);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

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

  if (user && (!user.organizations || user.organizations.length < 1)) {
    return <Redirect href="/welcome" />;
  }

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
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Opening homepage main modal"
                  onPress={openModal}
                  style={({ pressed }) => [
                    styles.middleButton,
                    {
                      backgroundColor: pressed
                        ? Colors.PRIMARY_DARK
                        : Colors.PRIMARY,
                      height: pressed ? 64 : 66,
                      width: pressed ? 64 : 66,
                    },
                  ]}
                >
                  <PlusIcon color={Colors.WHITE} />
                </Pressable>
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
                pathname: '/clients',
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
                  TEST CHANGE
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
      </Tabs>
      <MainPlusModal closeModal={closeModal} isModalVisible={isModalVisible} />
      <ConsentModal
        user={user}
        isModalVisible={tosModalIsOpen}
        closeModal={() => setTosModalIsOpen(false)}
        privacyPolicyUrl={privacyPolicyUrl}
        termsOfServiceUrl={termsOfServiceUrl}
      />
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
    borderRadius: 100,
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
