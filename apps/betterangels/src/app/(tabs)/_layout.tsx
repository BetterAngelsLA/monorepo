import {
  ConsentModal,
  FeatureFlags,
  MainPlusModal,
  useUser,
} from '@monorepo/expo/betterangels';
import {
  NoteIcon,
  PlusIcon,
  UsersLineIcon,
  UsersSolidIcon,
} from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ColorValue,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../../config';

interface TabIconProps {
  focused: boolean;
  color: ColorValue;
  Icon: React.ComponentType<{ color: string }>;
  InactiveIcon: React.ComponentType<{ color: string }>;
  label: string;
}

const TabIcon = ({
  focused,
  color,
  Icon,
  InactiveIcon,
  label,
}: TabIconProps): React.ReactElement => (
  <View style={styles.tabIconContainer}>
    {focused ? (
      <Icon color={color as string} />
    ) : (
      <InactiveIcon color={color as string} />
    )}
    <TextRegular color={color as string} size="xs" style={styles.labelText}>
      {label}
    </TextRegular>
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tosModalIsOpen, setTosModalIsOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useUser();
  // Same gate as `useHmisProdSessionWatch`: the HMIS shell and its screens
  // only make sense for sessions authenticated via HMIS — the flag alone can
  // be active for a BA-credential login, which must keep the regular tabs.
  const hmisProdDemoEnabled =
    useFeatureFlagActive(FeatureFlags.HMIS_PROD_DEMO) &&
    user?.isHmisUser === true;

  useEffect(() => {
    if (!user) return;

    const needsAgreements =
      user.hasAcceptedTos === false || user.hasAcceptedPrivacyPolicy === false;

    const shouldOpenTosModal =
      needsAgreements ||
      (user.hasAcceptedTos === true &&
        user.hasAcceptedPrivacyPolicy === true &&
        (!user.firstName || !user.lastName));

    if (shouldOpenTosModal) {
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
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate({
                pathname: '/',
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
                label={hmisProdDemoEnabled ? 'HMIS Clients' : 'Clients'}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="interactions"
          options={{
            href: hmisProdDemoEnabled ? null : undefined,
            title: '',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                focused={focused}
                color={color}
                Icon={NoteIcon}
                InactiveIcon={NoteIcon}
                label={user?.isHmisUser ? 'Notes' : 'Interactions'}
              />
            ),
          }}
        />
      </Tabs>

      {/*
        The "add" button is deliberately NOT a tab. As a `Tabs.Screen` it needed a
        route whose screen rendered `null`, and it depended on cancelling the tab
        press to avoid navigating there — reliable on native, but not on web, where
        the tab bar wraps every tab in an <a> and the navigation wins: pressing it
        landed on that empty screen instead of opening the modal. As a plain
        Pressable rendered by the layout it never participates in navigation, so
        both platforms behave identically with no platform branching.

        Still gated on `hmisProdDemoEnabled`, which is what the placeholder tab
        expressed with `href: hmisProdDemoEnabled ? null : undefined` — in that mode
        the button was not shown at all, so hoisting it must not start showing it.

        `pointerEvents` is set through `style` (the prop form is deprecated and
        warns on react-native-web). It is load-bearing: without `box-none` this
        wrapper swallows every tap in its square.
      */}
      {!hmisProdDemoEnabled && (
        <View
          style={[
            styles.plusButtonOverlay,
            { bottom: insets.bottom + 24, pointerEvents: 'box-none' },
          ]}
        >
          <Pressable
            testID="main-plus-tab-btn"
            accessibilityRole="button"
            accessibilityLabel="Add"
            accessibilityHint="Opening homepage main modal"
            onPress={() => setIsModalVisible(true)}
            style={({ pressed }) => [
              styles.plusButton,
              pressed && styles.plusButtonPressed,
            ]}
          >
            <PlusIcon color={Colors.WHITE} />
          </Pressable>
        </View>
      )}

      <MainPlusModal
        closeModal={() => setIsModalVisible(false)}
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
  /**
   * The "add" button, floated over the tab bar. Absolute rather than a tab slot,
   * because it is not a destination — see the comment at its render site.
   */
  plusButtonOverlay: {
    position: 'absolute',
    left: '50%',
    marginLeft: -40,
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
