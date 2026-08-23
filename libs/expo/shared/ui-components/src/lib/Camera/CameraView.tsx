import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors } from '@monorepo/expo/shared/static';
import {
  CameraType,
  CameraView as ExpoCamera,
  FlashMode,
  ImageType,
} from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { isSimulator } from './isSimulator';
import { CameraFooter, CameraHeader } from './ui';
import { useCapturePicture } from './useCapturePicture';

interface CameraProps {
  onCapture: (file: ReactNativeFile) => void;
  onCancel: () => void;
  imageType?: ImageType;
  style?: StyleProp<ViewStyle>;
}

export function CameraView(props: CameraProps) {
  const { onCapture, onCancel, imageType = 'jpg', style } = props;

  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Drops the preview as soon as this camera is on its way out.
   *
   * A running preview layer composited against the closing animation starves
   * the main thread — the next screen paints but ignores touches for as long as
   * it takes. Unmounting the preview at the *start* of the close, rather than
   * when the whole view finally unmounts, keeps that off the animation.
   */
  const [isClosing, setIsClosing] = useState(false);

  const cameraRef = useRef<ExpoCamera | null>(null);

  const { capture } = useCapturePicture({ imageType });

  async function handleCapture() {
    if (isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const result = await capture(cameraRef);

      if (result.type === 'success') {
        setIsClosing(true);
        onCapture(result.file);
      }

      if (result.type === 'error') {
        console.error(result.error);
      }
    } finally {
      setIsCapturing(false);
    }
  }

  function handleCancel() {
    setIsClosing(true);
    onCancel();
  }

  function toggleFlash() {
    setFlashMode((current) => {
      return current === 'on' ? 'off' : 'on';
    });
  }

  function toggleCameraType() {
    setCameraType((current) => {
      return current === 'front' ? 'back' : 'front';
    });
  }

  return (
    <View style={[styles.root, style]} testID="camera-view">
      {!isClosing &&
        (isSimulator ? (
          // The iOS Simulator has no camera: mounting the real view would
          // create an AVCaptureSession that can never start and block for ~9s.
          // Show a black placeholder instead so open/close stays instant.
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderWidth: 4, borderColor: 'blue' },
            ]}
            testID="camera-preview-placeholder"
          />
        ) : (
          <ExpoCamera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={cameraType}
            flash={flashMode}
          />
        ))}

      <CameraHeader flashMode={flashMode} onToggleFlash={toggleFlash} />
      <CameraFooter
        onCancel={handleCancel}
        onCapture={handleCapture}
        onToggleCameraType={toggleCameraType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BLACK,
  },
});
