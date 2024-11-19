import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  BoltIcon,
  BoltSlashIcon,
  CameraRotateIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { CameraType, CameraView, FlashMode } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import IconButton from '../IconButton';
import TextButton from '../TextButton';
import TextMedium from '../TextMedium';

interface ICameraProps {
  onCapture: (file: ReactNativeFile) => void;
  setIsCameraOpen: (isCameraOpen: boolean) => void;
  setModalVisible: (isModalVisible: boolean) => void;
}

export default function Camera(props: ICameraProps) {
  const { onCapture, setIsCameraOpen, setModalVisible } = props;
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');

  const cameraRef = useRef<CameraView | null>(null);

  const toggleFlashLight = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        const resizedPhoto = await resizeImage({ uri: photo.uri });
        const file = new ReactNativeFile({
          uri: resizedPhoto.uri,
          name: `${Date.now().toString()}.jpg`,
          type: 'image/jpeg',
        });
        onCapture(file);
      }
      setIsCameraOpen(false);
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
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
            <BoltSlashIcon size="md" color={Colors.WHITE} />
          </IconButton>
        ) : (
          <IconButton
            onPress={toggleFlashLight}
            accessibilityLabel="flash"
            accessibilityHint="disables flash"
            variant="transparent"
          >
            <BoltIcon size="md" color={Colors.WHITE} />
          </IconButton>
        )}
      </View>
      <View style={{ flex: 5 }}>
        <CameraView
          style={styles.camera}
          facing={type}
          flash={flash}
          ref={cameraRef}
        />
      </View>
      <View
        style={{
          flex: 2,
          backgroundColor: Colors.BLACK,
          paddingTop: Spacings.xs,
          paddingHorizontal: Spacings.md,
        }}
      >
        <TextMedium textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
          PHOTO
        </TextMedium>
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
          <Pressable
            onPress={captureImage}
            style={{ flex: 2, alignItems: 'center' }}
            accessibilityRole="button"
            accessible
            accessibilityLabel="capture"
            accessibilityHint="captures image"
          >
            {({ pressed }) => (
              <View
                style={{
                  backgroundColor: Colors.BLACK,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: Radiuses.xxxl,
                  borderWidth: 5,
                  borderColor: Colors.WHITE,
                  height: 60,
                  width: 60,
                }}
              >
                <View
                  style={{
                    backgroundColor: Colors.WHITE,
                    borderRadius: Radiuses.xxxl,
                    height: pressed ? 38 : 45,
                    width: pressed ? 38 : 45,
                  }}
                />
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View
              style={{
                backgroundColor: '#1C1C1C',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: Radiuses.xxxl,
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
                <CameraRotateIcon color={Colors.WHITE} />
              </IconButton>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
  },
});
