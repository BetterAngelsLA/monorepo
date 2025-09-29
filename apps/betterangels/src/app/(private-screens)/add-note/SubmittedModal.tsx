import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import React from 'react';
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedIcon from './AnimatedIcon';

const IMAGE_SOURCE = '../../assets/images/transparent-logo.png';

interface ISubmittedModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  firstName: string | null | undefined;
}

export default function SubmittedModal({
  closeModal,
  isModalVisible,
  firstName,
}: ISubmittedModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle="overFullScreen"
      onRequestClose={closeModal}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback accessibilityRole="button" onPress={closeModal}>
        <View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', opacity: 0.5 },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Content */}
      <View style={styles.container}>
        <AnimatedIcon />

        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + Spacings.xs,
              paddingBottom: 35 + insets.bottom,
            },
          ]}
        >
          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            accessible
            accessibilityHint="closes the modal"
            accessibilityRole="button"
            accessibilityLabel="close"
            onPress={closeModal}
          >
            <PlusIcon rotate="45deg" size="md" color={Colors.BLACK} />
          </Pressable>

          <View style={styles.modalOverlay}>
            <TextBold color={Colors.PRIMARY_DARK} size="xl">
              You are such an Angel!
            </TextBold>
            <Image
              accessibilityIgnoresInvertColors
              source={require(IMAGE_SOURCE)}
              style={{
                width: 120,
                height: 115,
                marginTop: 67,
                marginBottom: 50,
              }}
            />
            <TextRegular textAlign="center" size="md">
              Thank you for helping{firstName ? ` ${firstName}` : ''}!
            </TextRegular>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: Spacings.md,
    backgroundColor: Colors.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacings.md,
    right: Spacings.sm,
    padding: Spacings.sm,
  },
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
