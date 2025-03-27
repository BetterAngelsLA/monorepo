import {
  FilePlusIcon,
  PlusIcon,
  UserAddIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFeatureFlagActive } from '../hooks';
import { FeatureFlags } from '../providers/featureControls/constants';
import MainModal from './MainModal';

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
}

export default function MainPlusModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal } = props;
  const clientRedesignFeatureOn = useFeatureFlagActive(
    FeatureFlags.PROFILE_REDESIGN_FF
  );

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
      route: clientRedesignFeatureOn ? '/clients/create' : '/add-client',
    },
  ];

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
