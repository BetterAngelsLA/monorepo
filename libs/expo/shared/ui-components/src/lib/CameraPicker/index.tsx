import { CameraIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, View } from 'react-native';
import IconButton from '../IconButton';

interface ICameraPickerProps {
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  images: string[];
}

export default function CameraPicker(props: ICameraPickerProps) {
  const { setImages, images } = props;
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [type, setType] = useState(CameraType.back);
  const [flash, setFlash] = useState(FlashMode.off);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const cameraRef = useRef<Camera | null>(null);

  const captureImage = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log('Photo captured:', photo.uri);
      setImages([...images, photo.uri]);
      setIsCameraOpen(false);
    }
  };

  const getPermissionsAndOpenCamera = async () => {
    if (permission) {
      const { granted } = await requestPermission();
      if (granted) {
        setIsCameraOpen(true);
      } else {
        Alert.alert(
          'Permission Denied',
          'You need to grant camera permission to use this app'
        );
      }
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const toggleFlashLight = () => {
    setFlash((current) =>
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  const toggleCameraType = () => {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (isCameraOpen) {
    return (
      <Modal>
        <View style={{ flex: 1 }}>
          <Camera
            style={styles.camera}
            type={type}
            flashMode={flash}
            ref={cameraRef}
          >
            <View style={styles.buttonContainer}>
              <Button
                title={flash === 'on' ? 'Flash on' : 'Flash off'}
                onPress={toggleFlashLight}
              />
              <Button title="Close" onPress={closeCamera} />
              <Button title="Flip Camera" onPress={toggleCameraType} />
              <Button title="Capture" onPress={captureImage} />
            </View>
          </Camera>
        </View>
      </Modal>
    );
  }

  return (
    <IconButton
      accessibilityLabel="camera"
      accessibilityHint="opens camera"
      variant="transparent"
      onPress={getPermissionsAndOpenCamera}
    >
      <CameraIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
});
