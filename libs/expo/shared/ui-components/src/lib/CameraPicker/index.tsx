import {
  ArrowRotateReverseIcon,
  BoltIcon,
  BoltSlashIcon,
  CameraIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import H5 from '../H5';
import IconButton from '../IconButton';
import TextButton from '../TextButton';

type TImages = string[];

interface ICameraPickerProps {
  setImages: React.Dispatch<React.SetStateAction<TImages>>;
  images: TImages;
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
      const cameraInfo = await cameraRef.current.getCameraInfoAsync();
      if (cameraInfo) {
        const maxResolution = cameraInfo.photoSizes.reduce(
          (
            max: { width: number; height: number },
            size: { width: number; height: number }
          ) => {
            return size.width * size.height > max.width * max.height
              ? size
              : max;
          },
          { width: 0, height: 0 }
        );

        const veryHighResolutionThreshold = 12 * 1000000;
        const isHighResolution =
          maxResolution.width * maxResolution.height >=
          veryHighResolutionThreshold;

        const quality = isHighResolution ? 0.7 : 1;
        const photo = await cameraRef.current.takePictureAsync({ quality });

        setImages([...images, photo.uri]);
      }
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
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.BLACK,
            justifyContent: 'center',
          }}
        >
          {flash === 'off' ? (
            <IconButton
              onPress={toggleFlashLight}
              accessibilityLabel="flash"
              accessibilityHint="enables flash"
              variant="transparent"
            >
              <BoltSlashIcon size="lg" color={Colors.WHITE} />
            </IconButton>
          ) : (
            <IconButton
              onPress={toggleFlashLight}
              accessibilityLabel="flash"
              accessibilityHint="disables flash"
              variant="transparent"
            >
              <BoltIcon color={Colors.WHITE} />
            </IconButton>
          )}
        </View>
        <View style={{ flex: 5 }}>
          <Camera
            ratio="4:3"
            style={styles.camera}
            type={type}
            flashMode={flash}
            ref={cameraRef}
          ></Camera>
        </View>
        <View
          style={{
            flex: 2,
            backgroundColor: Colors.BLACK,
            paddingTop: Spacings.xs,
            paddingHorizontal: Spacings.md,
          }}
        >
          <H5 textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
            PHOTO
          </H5>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TextButton
              style={{ flex: 1 }}
              color={Colors.WHITE}
              onPress={closeCamera}
              accessibilityHint="closes camera"
              title="Cancel"
            />
            <TouchableOpacity
              onPress={captureImage}
              style={{ flex: 2, alignItems: 'center' }}
              accessibilityRole="button"
              accessible
              accessibilityLabel="capture"
              accessibilityHint="captures image"
            >
              <View
                style={{
                  backgroundColor: Colors.WHITE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  height: 70,
                  width: 70,
                }}
              />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                style={{
                  backgroundColor: '#1C1C1C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 100,
                  height: 41,
                  width: 41,
                }}
              >
                <IconButton
                  onPress={toggleCameraType}
                  accessibilityLabel="change camera"
                  accessibilityHint="toggles front/back camera"
                  variant="transparent"
                >
                  <ArrowRotateReverseIcon color={Colors.WHITE} />
                </IconButton>
              </View>
            </View>
          </View>
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
      <CameraIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
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
