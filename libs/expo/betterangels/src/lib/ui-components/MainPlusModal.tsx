import {
  FilePlusIcon,
  UserAddIcon,
  XmarkIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import MainModal from './MainModal';

const ACTIONS = [
  {
    title: 'Add interaction',
    Icon: FilePlusIcon,
    route: '/clients',
    params: {
      title: 'Who is this interaction for?',
      select: 'true',
    },
  },
  {
    title: 'Add client',
    Icon: UserAddIcon,
    route: '/clients', // TODO: update path once add client screen is created
  },
];

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
}

export default function MainPlusModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal } = props;
  return (
    <MainModal
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      opacity={0.5}
      bottomSection={
        <View style={styles.wrapper}>
          <Pressable
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityHint="Closing homepage main modal"
            style={({ pressed }) => [
              styles.middleButton,
              {
                backgroundColor: pressed ? Colors.PRIMARY_DARK : Colors.PRIMARY,
                height: pressed ? 64 : 66,
                width: pressed ? 64 : 66,
              },
            ]}
          >
            <XmarkIcon color={Colors.WHITE} />
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  // Added wrapper to avoid the UI shifting when button height changes
  wrapper: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  middleButton: {
    marginTop: Spacings.sm,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
