import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { DimensionValue, Pressable, View } from 'react-native';
import RnModal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  closeButton?: boolean;
  opacity?: number;
  vertical?: boolean;
  ml?: number;
  height?: DimensionValue;
  children: ReactNode;
  mt?: number;
  propogateSwipe?: boolean;
  onLayout?: () => void;
}

export default function Modal(props: IModalProps) {
  const {
    isModalVisible,
    closeModal,
    children,
    closeButton,
    opacity = 0,
    vertical = false,
    ml = 0,
    height = 'auto',
    mt,
    propogateSwipe = false,
    onLayout,
  } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;
  return (
    <RnModal
      onLayout={onLayout}
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
      onSwipeComplete={closeModal}
      useNativeDriverForBackdrop={true}
      swipeDirection={vertical ? ['down'] : ['right']}
      propagateSwipe={propogateSwipe}
    >
      <View
        style={{
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          paddingBottom: 35 + bottomOffset,
          paddingTop: Spacings.xs,
          marginTop: mt || topOffset,
          backgroundColor: Colors.WHITE,
          height,
        }}
      >
        {propogateSwipe && (
          <View
            style={{
              marginHorizontal: 'auto',
              width: 54,
              height: 5,
              borderRadius: 4,
              backgroundColor: Colors.NEUTRAL_LIGHT,
              marginBottom: Spacings.sm,
            }}
          />
        )}
        {closeButton && (
          <Pressable
            style={{ marginLeft: 'auto', marginRight: Spacings.md }}
            accessible
            accessibilityHint="closes the modal"
            accessibilityRole="button"
            accessibilityLabel="close"
            onPress={closeModal}
          >
            <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
          </Pressable>
        )}
        {children}
      </View>
    </RnModal>
  );
}
