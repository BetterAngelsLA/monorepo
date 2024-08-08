import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { hexToRGBA } from '@monorepo/expo/shared/utils';
import { Modal, Pressable, TouchableWithoutFeedback, View } from 'react-native';
import IconButton from '../IconButton';

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
              padding: Spacings.md,
              paddingTop: Spacings.xs,
              paddingRight: Spacings.xs,
              borderRadius: Radiuses.xs,
              zIndex: 1,
            }}
          >
            <IconButton
              style={{ alignSelf: 'flex-end' }}
              variant="transparent"
              onPress={hideModal}
              accessibilityLabel="close modal"
              accessibilityHint="closing public note information modal"
            >
              <PlusIcon size="sm" rotate="45deg" />
            </IconButton>
            <View style={{ paddingRight: Spacings.sm }}>{children}</View>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
}
