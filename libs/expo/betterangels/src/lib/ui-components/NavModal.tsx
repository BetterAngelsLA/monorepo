import {
  BarsIcon,
  SettingsOutlineIcon,
  SignOutIcon,
  TaskListIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFeatureFlagActive, useSignOut, useUser } from '../hooks';
import { FeatureFlags } from '../providers';
import { MainModal } from './MainModal';

interface INavModalProps {
  image?: string;
}

export default function NavModal(props: INavModalProps) {
  const { isHmisUser } = useUser();

  const { image } = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  const { signOut } = useSignOut();

  const tasksFeatureOn = useFeatureFlagActive(FeatureFlags.TASKS_FF);

  const ACTIONS = [
    tasksFeatureOn && {
      title: 'Tasks',
      Icon: TaskListIcon,
      route: '/tasks',
    },
    { title: 'Settings', Icon: SettingsOutlineIcon, route: '/settings' },
  ].filter(Boolean);

  return (
    <>
      <Pressable
        onPress={openModal}
        accessibilityRole="button"
        accessibilityHint="opens main navigation modal"
      >
        <BarsIcon size={'xl'} color={Colors.WHITE} />
      </Pressable>
      <MainModal
        ml={Spacings.xl}
        opacity={0.5}
        closeButton
        actions={ACTIONS}
        isModalVisible={isModalVisible}
        closeModal={closeModal}
        height="100%"
        topSection={
          <Pressable
            onPress={() => {
              closeModal();
              router.navigate('/profile');
            }}
            accessibilityRole="button"
            style={styles.container}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  backgroundColor: pressed
                    ? Colors.NEUTRAL_EXTRA_LIGHT
                    : Colors.WHITE,
                  borderRadius: Radiuses.xs,
                  paddingHorizontal: Spacings.sm,
                  paddingVertical: Spacings.sm,
                }}
              >
                <View style={{ marginRight: Spacings.sm }}>
                  <Avatar
                    imageUrl={image}
                    size="lg"
                    accessibilityHint="my avatar"
                    accessibilityLabel="My Avatar"
                  />
                </View>

                <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
                  Profile
                </TextRegular>
                {isHmisUser && (
                  <View style={styles.profileTag}>
                    <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
                      HMIS
                    </TextRegular>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        }
        bottomSection={
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            style={styles.container}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  backgroundColor: pressed
                    ? Colors.NEUTRAL_EXTRA_LIGHT
                    : Colors.WHITE,
                  borderRadius: Radiuses.xs,
                  paddingHorizontal: Spacings.sm,
                  paddingVertical: Spacings.sm,
                }}
              >
                <View
                  style={{
                    marginRight: Spacings.sm,
                    height: Spacings.xl,
                    width: Spacings.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SignOutIcon color={Colors.PRIMARY_EXTRA_DARK} />
                </View>

                <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
                  Log Out
                </TextRegular>
              </View>
            )}
          </Pressable>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTag: {
    marginLeft: 'auto',
    backgroundColor: Colors.BRAND_SKY_BLUE,
    borderRadius: Radiuses.md,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
});
