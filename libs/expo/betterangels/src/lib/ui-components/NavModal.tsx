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
import { Avatar, BodyText } from '@monorepo/expo/shared/ui-components';
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
    route: '#',
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
                  paddingRight: Spacings.sm,
                  paddingLeft: Spacings.xs,
                  paddingVertical: Spacings.sm,
                }}
              >
                <View style={{ marginRight: 20 }}>
                  <Avatar
                    imageUrl={image}
                    size="md"
                    hasBorder
                    borderColor={Colors.BLACK}
                    accessibilityHint="my avatar"
                    accessibilityLabel="My Avatar"
                  />
                </View>

                <BodyText color={Colors.PRIMARY_EXTRA_DARK}>Profile</BodyText>
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
                <SignOutIcon mr="md" color={Colors.PRIMARY_EXTRA_DARK} />

                <BodyText ml="xs" color={Colors.PRIMARY_EXTRA_DARK}>
                  Log Out
                </BodyText>
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
