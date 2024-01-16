import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { hexToRGBA } from '@monorepo/expo/shared/utils';
import { Modal, Pressable, TouchableWithoutFeedback, View } from 'react-native';

interface IBasicModalProps {
  children: React.ReactNode;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function BasicModal(props: IBasicModalProps) {
  const { children, visible, setVisible } = props;

  const hideModal = () => {
    setVisible(false);
  };
  return (
    <Modal transparent visible={visible} onDismiss={hideModal}>
      <Pressable
        onPress={hideModal}
        accessibilityRole="button"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hexToRGBA(Colors.NEUTRAL_EXTRA_DARK, 0.95),
          paddingHorizontal: Spacings.sm,
          position: 'relative',
        }}
      >
        <TouchableWithoutFeedback accessibilityRole="button">
          <View
            onTouchEnd={(e) => {
              e.preventDefault();
            }}
            style={{
              backgroundColor: Colors.WHITE,
              paddingLeft: Spacings.md,
              paddingRight: Spacings.xs,
              paddingTop: Spacings.md,
              paddingBottom: Spacings.xl,
              borderRadius: 8,
              zIndex: 1,
            }}
          >
            {children}
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}
