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
import { CameraFooter, CameraHeader } from './ui';
import { useCapturePicture } from './useCapturePicture';
import { isIosSimulator } from './utils';

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
   * Drop the live preview as soon as the camera's done: a running
   * AVCaptureSession is too expensive to keep mounted.
   */
  const [isCameraActive, setIsCameraActive] = useState(true);

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
        setIsCameraActive(false);
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
    setIsCameraActive(false);
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

  if (!isCameraActive) {
    return null;
  }

  return (
    <View style={[styles.root, style]} testID="camera-view">
      {!isIosSimulator && (
        // standard prd expo-camera experience (non iOS simulator)
        <ExpoCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={cameraType}
          flash={flashMode}
        />
      )}

      {isIosSimulator && (
        // The iOS Simulator has no camera: mounting the real view would
        // create an AVCaptureSession that can never start and block for ~9s.
        // Show a black placeholder instead so open/close stays instant.
        <View
          style={[StyleSheet.absoluteFill]}
          testID="camera-preview-placeholder"
        />
      )}

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
