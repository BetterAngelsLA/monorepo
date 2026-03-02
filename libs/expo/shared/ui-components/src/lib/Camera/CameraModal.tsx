import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { BaseModal } from '../Modal';
import { CameraView } from './CameraView';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: ReactNativeFile) => void;
};

export function CameraModal(props: Props) {
  const { isOpen, onClose, onCapture } = props;

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function ensurePermission() {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          'Permission Denied',
          'You need to grant camera permission to use this feature.'
        );

        onClose();
      }
    }

    ensurePermission();
  }, [isOpen, requestPermission, onClose]);

  if (!isOpen) {
    return null;
  }

  if (!permission?.granted) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      backdropOpacity={0.5}
      variant="sheet"
      direction="up"
      onClose={onClose}
      panelStyle={styles.panel}
      contentStyle={styles.content}
    >
      <CameraView onCapture={onCapture} onCancel={onClose} />
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 0,
  },
});
