import {
  FilePlusIcon,
  HouseLineIcon,
  PlusIcon,
  UserAddIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useUser } from '../hooks';
import { useShelterHomeUrl } from '../shelter/useOpenShelterSearch';
import { MainModal, TMainModalAction } from './MainModal';

interface IMainPlusModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
}

export default function MainPlusModal(props: IMainPlusModalProps) {
  const { isModalVisible, closeModal } = props;

  const { user } = useUser();
  const router = useRouter();
  const shelterUrl = useShelterHomeUrl();

  // HMIS sessions see HMIS clients, whose profile has no shelter button of its
  // own, so this entry would lead to a list they are not shown anywhere else.
  const showFindShelter = Boolean(shelterUrl) && user?.isHmisUser !== true;

  /**
   * Where to go once the sheet has finished closing.
   *
   * Navigating while it is still animating out crashes the native mounting
   * layer when the destination has a header: iOS segfaults inside Fabric's
   * `uiManagerDidFinishTransaction`. So the action records the destination and
   * closes; `onCloseComplete` does the navigating.
   */
  const [pendingRoute, setPendingRoute] = useState<{
    pathname: string;
    params?: Record<string, string>;
  } | null>(null);

  function closeThenNavigate(
    pathname: string,
    params?: Record<string, string>,
  ) {
    setPendingRoute({ pathname, params });
    closeModal();
  }

  const ACTIONS: TMainModalAction[] = [
    {
      title: 'Add client',
      testId: 'add-client-btn',
      Icon: UserAddIcon,
      onPress: () => closeThenNavigate('/clients/create'),
    },
    {
      title: `Add ${user?.isHmisUser ? 'note' : 'interaction'}`,
      Icon: FilePlusIcon,
      onPress: () =>
        closeThenNavigate('/', {
          createInteraction: 'true',
        }),
    },
  ];

  if (showFindShelter) {
    ACTIONS.push({
      title: 'Find shelter',
      testId: 'find-shelter-btn',
      Icon: HouseLineIcon,
      onPress: () => closeThenNavigate('/find-shelter'),
    });
  }

  return (
    <MainModal
      vertical={true}
      actions={ACTIONS}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      onCloseComplete={() => {
        if (!pendingRoute) return;

        router.navigate({
          pathname: pendingRoute.pathname,
          params: pendingRoute.params,
        });
        setPendingRoute(null);
      }}
      opacity={0.5}
      bottomSection={
        <View style={styles.wrapper}>
          <Pressable
            onPress={closeModal}
            testID="main-plus-modal-btn"
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
