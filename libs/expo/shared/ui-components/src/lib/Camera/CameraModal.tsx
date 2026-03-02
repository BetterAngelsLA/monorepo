import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { BaseModal } from '../Modal';
import { CameraView } from './CameraView';

type Props = {
  /**
   * Called when the user cancels or permission is denied.
   * Parent must unmount <CameraModal /> in response.
   */
  onClose: () => void;

  /**
   * Called when a photo is successfully captured.
   * Parent is responsible for unmounting after handling.
   */
  onCapture: (file: ReactNativeFile) => void;
};

/**
 * CameraModal
 *
 * IMPORTANT:
 * This component is intentionally mount-driven.
 *
 * It MUST be conditionally rendered:
 *
 *   {isActive && <CameraModal ... />}
 *
 * Not using an `isOpen` prop as:
 * Toggling visibility (rendering `null`) does NOT fully detach
 * the native camera preview. It must be fully unmounted to
 * properly release the surface and avoid blocking gestures.
 */

export function CameraModal({ onClose, onCapture }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  // Request permission on mount
  useEffect(() => {
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
  }, [requestPermission, onClose]);

  if (!permission?.granted) {
    return null;
  }

  return (
    <BaseModal
      isOpen={true}
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
