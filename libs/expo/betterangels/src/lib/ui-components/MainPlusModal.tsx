import {
  FilePlusIcon,
  PlusIcon,
  UserAddIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';

import { useUser } from '../hooks';
import { MainModal, TMainModalAction } from './MainModal';

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
}

export default function MainPlusModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal } = props;

  const { isHmisUser } = useUser();

  // shared actions
  const ACTIONS: TMainModalAction[] = [
    {
      title: 'Add client',
      Icon: UserAddIcon,
      route: '/clients/create',
    },
    {
      title: `Add ${isHmisUser ? 'note' : 'interaction'}`,
      Icon: FilePlusIcon,
      route: '/',
      params: {
        createInteraction: 'true',
      },
    },
  ];

  // non-hmis actions
  if (!isHmisUser) {
    ACTIONS.unshift();
  }

  return (
    <MainModal
      vertical={true}
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
            <PlusIcon color={Colors.WHITE} rotate="45deg" />
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  middleButton: {
    marginTop: Spacings.sm,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
