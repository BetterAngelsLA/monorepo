import {
  BurgerSodaIcon,
  CalendarIcon,
  HouseBlankIcon,
  ListIcon,
  MapIcon,
  NoteIcon,
  SignOutIcon,
  UsersIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSignOut } from '../hooks';
import MainModal from './MainModal';

const ACTIONS = [
  {
    title: 'Home',
    Icon: HouseBlankIcon,
    route: '#',
  },
  {
    title: 'Clients',
    Icon: UsersIcon,
    route: '#',
  },
  {
    title: 'Map',
    Icon: MapIcon,
    route: '#',
  },
  {
    title: 'Interactions',
    Icon: NoteIcon,
    route: '/interactions',
  },
  {
    title: 'Tasks',
    Icon: ListIcon,
    route: '#',
  },
  {
    title: 'Services',
    Icon: BurgerSodaIcon,
    route: '#',
  },
  {
    title: 'Schedule',
    Icon: CalendarIcon,
    route: '#',
  },
];

interface INavModalProps {
  image?: string;
}

export default function NavModal(props: INavModalProps) {
  const { image } = props;
  const [isModalVisible, setModalVisible] = useState(false);
  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  const { signOut } = useSignOut();
  return (
    <>
      <Pressable
        onPress={openModal}
        accessibilityRole="button"
        accessibilityHint="opens main navigation modal"
      >
        <Avatar
          mb="xs"
          hasBorder
          borderColor={Colors.BLACK}
          accessibilityHint="my avatar"
          accessibilityLabel="My Avatar"
          size="md"
        />
      </Pressable>
      <MainModal
        transparent
        closeButton
        actions={ACTIONS}
        isModalVisible={isModalVisible}
        closeModal={closeModal}
        topSection={
          <Pressable accessibilityRole="button" style={styles.container}>
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  backgroundColor: pressed
                    ? Colors.NEUTRAL_EXTRA_LIGHT
                    : Colors.WHITE,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: Spacings.sm,
                }}
              >
                <View style={{ marginRight: Spacings.sm }}>
                  <Avatar
                    imageUrl={image}
                    size="md"
                    hasBorder
                    borderColor={Colors.BLACK}
                    accessibilityHint="my avatar"
                    accessibilityLabel="My Avatar"
                  />
                </View>

                <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
                  Profile
                </TextRegular>
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
                  borderRadius: 8,
                  paddingHorizontal: Spacings.sm,
                  paddingVertical: Spacings.sm,
                }}
              >
                <View
                  style={{
                    marginRight: Spacings.sm,
                    height: 40,
                    width: 40,
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
});
