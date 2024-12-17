import {
  ConsentModal,
  MainPlusModal,
  useUser,
} from '@monorepo/expo/betterangels';
import {
  HouseLineIcon,
  HouseSolidIcon,
  PlusIcon,
  UsersLineIcon,
  UsersSolidIcon,
} from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../../config';

interface TabIconProps {
  focused: boolean;
  color: string;
  Icon: React.FC<{ color: string }>;
  InactiveIcon: React.FC<{ color: string }>;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({
  focused,
  color,
  Icon,
  InactiveIcon,
  label,
}) => (
  <View style={styles.tabIconContainer}>
    {focused ? <Icon color={color} /> : <InactiveIcon color={color} />}
    <TextRegular color={color} size="xs" style={styles.labelText}>
      {label}
    </TextRegular>
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setModalVisible] = useState(false);
  const [tosModalIsOpen, setTosModalIsOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (
      user?.hasAcceptedTos === false ||
      user?.hasAcceptedPrivacyPolicy === false
    ) {
      setTosModalIsOpen(true);
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth" />;
  if (!user.organizations?.length) return <Redirect href="/welcome" />;

  const screenOptions = {
    tabBarShowLabel: false,
    tabBarActiveTintColor: Colors.PRIMARY_EXTRA_DARK,
    tabBarInactiveTintColor: Colors.NEUTRAL_DARK,
    tabBarStyle: [styles.tabBar, { height: 70 + insets.bottom }],
    tabBarItemStyle: styles.tabBarItem,
    headerStyle: { backgroundColor: Colors.BRAND_DARK_BLUE },
    headerShadowVisible: false,
  };

  return (
    <>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                Icon={HouseSolidIcon}
                InactiveIcon={HouseLineIcon}
                label="Home"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="drawerPlaceholder"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setModalVisible(true);
            },
          }}
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.plusButtonWrapper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Opening homepage main modal"
                  onPress={() => setModalVisible(true)}
                  style={({ pressed }) => [
                    styles.plusButton,
                    pressed && styles.plusButtonPressed,
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
                params: { title: '', select: 'false' },
              });
            },
          }}
          options={{
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                Icon={UsersSolidIcon}
                InactiveIcon={UsersLineIcon}
                label="All Clients"
              />
            ),
          }}
        />

        {/* Hidden routes */}
        {['map', 'teams', 'calendar', 'appointment'].map((name) => (
          <Tabs.Screen key={name} name={name} options={{ href: null }} />
        ))}
      </Tabs>

      <MainPlusModal
        closeModal={() => setModalVisible(false)}
        isModalVisible={isModalVisible}
      />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    borderTopWidth: 0,
  },
  tabBarItem: {
    paddingVertical: 15,
  },
  tabIconContainer: {
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  labelText: {
    textAlign: 'center',
  },
  plusButtonWrapper: {
    position: 'relative',
    bottom: 36,
    height: 80,
    width: 80,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
  plusButton: {
    height: 66,
    width: 66,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
  },
  plusButtonPressed: {
    backgroundColor: Colors.PRIMARY_DARK,
    height: 64,
    width: 64,
  },
});
