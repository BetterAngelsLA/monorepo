import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { ElementType, Fragment, ReactNode, isValidElement } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainModalActionBtn } from './MainModalActionBtn';
import { MainModalCloseBtn } from './MainModalCloseBtn';

export type TMainModalAction = {
  title: string;
  Icon: ElementType;
  route?: string;
  params?: Record<string, string>;
  onPress?: () => void;
};

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: (TMainModalAction | ReactNode)[];
  bottomSection?: ReactNode;
  topSection?: ReactNode;
  closeButton?: boolean;
  opacity?: number;
  vertical?: boolean;
  ml?: number;
  height?: DimensionValue;
}

export function MainModal(props: IMainModalProps) {
  const {
    isModalVisible,
    closeModal,
    actions,
    bottomSection,
    topSection,
    closeButton,
    opacity = 0,
    vertical = false,
    ml = 0,
    height = 'auto',
  } = props;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <Modal
      style={{
        margin: 0,
        marginLeft: ml,
        flex: 1,
        justifyContent: 'flex-end',
      }}
      animationIn={vertical ? 'slideInUp' : 'slideInRight'}
      animationOut={vertical ? 'slideOutDown' : 'slideOutRight'}
      backdropOpacity={opacity}
      isVisible={isModalVisible}
      onBackdropPress={closeModal}
      useNativeDriverForBackdrop={true}
    >
      <View
        style={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          paddingTop: topOffset + Spacings.xs,
          paddingHorizontal: Spacings.md,
          paddingBottom: 35 + bottomOffset,
          backgroundColor: Colors.WHITE,
          height,
        }}
      >
        {closeButton && <MainModalCloseBtn onPress={closeModal} />}

        <View style={styles.modalOverlay}>
          {topSection}

          {actions.map((action, idx: number) => {
            // if action is a ReactNode, return (render)
            if (isValidElement(action)) {
              return <Fragment key={idx}>{action}</Fragment>;
            }

            // is not ReactNode, so treat as `TMainModalAction` type
            const { title, route, params, Icon, onPress } =
              action as TMainModalAction;

            return (
              <MainModalActionBtn
                key={idx}
                title={title}
                Icon={Icon}
                onPress={() => {
                  // custom callback: invoke and return
                  if (onPress) {
                    return onPress();
                  }

                  // default behavior
                  closeModal();

                  if (route) {
                    router.navigate({
                      pathname: route,
                      params: params,
                    });
                  }
                }}
              />
            );
          })}

          {bottomSection}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
