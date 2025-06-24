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
  fullWidth?: boolean;
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
    fullWidth = true,
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
      swipeDirection={
        propogateSwipe ? (vertical ? 'down' : 'right') : undefined
      }
      propagateSwipe={propogateSwipe}
    >
      <View
        style={{
          flex: fullWidth ? 1 : undefined,
          borderTopLeftRadius: Radiuses.xs,
          borderTopRightRadius: Radiuses.xs,
          paddingBottom: 35 + bottomOffset,
          paddingTop: fullWidth ? topOffset + Spacings.xs : Spacings.xs,
          marginTop: mt,
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
