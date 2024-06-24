import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ISubmittedModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  firstName: string | null | undefined;
}

export default function SubmittedModal(props: ISubmittedModalProps) {
  const { closeModal, isModalVisible, firstName } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;

  return (
    <Modal
      style={{
        margin: 0,
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: Colors.WHITE,
      }}
      isVisible={isModalVisible}
      onBackdropPress={closeModal}
    >
      <View
        style={{
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          paddingTop: topOffset + Spacings.xs,
          paddingHorizontal: Spacings.md,
          paddingBottom: 35 + bottomOffset,
          backgroundColor: Colors.WHITE,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: Spacings.sm,
            right: Spacings.sm,
            padding: Spacings.sm,
          }}
          accessible
          accessibilityHint="closes the modal"
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={closeModal}
        >
          <XmarkIcon size="md" color={Colors.BLACK} />
        </Pressable>

        <View style={styles.modalOverlay}>
          <TextBold color={Colors.PRIMARY_DARK} size="xl">
            You are such an Angel!
          </TextBold>
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../assets/images/transparent-logo.png')}
            style={{ width: 120, height: 115, marginTop: 67, marginBottom: 50 }}
          />
          <TextRegular textAlign="center" size="md">
            Thank you for helping{firstName ? ` ${firstName}` : ''}!
          </TextRegular>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
