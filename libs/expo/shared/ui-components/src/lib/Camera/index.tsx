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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const toggleFlashLight = () =>
    setFlash((cur) => (cur === 'off' ? 'on' : 'off'));
  const toggleCameraType = () =>
    setType((cur) => (cur === 'back' ? 'front' : 'back'));
  const closeCamera = () => setIsCameraOpen(false);

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
    <View style={styles.root}>
      {/* Full-bleed camera preview (cover) */}
      <CameraView
        ref={cameraRef}
        style={[StyleSheet.absoluteFillObject]}
        // If some Android devices still show thin bars, uncomment:
        // style={[StyleSheet.absoluteFillObject, { transform: [{ scaleX: 1.06 }, { scaleY: 1.06 }] }]}
        facing={type}
        flash={flash}
      />

      {/* Top overlay (flash) */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacings.xs }]}>
        <IconButton
          onPress={toggleFlashLight}
          accessibilityLabel="flash"
          accessibilityHint={
            flash === 'off' ? 'enables flash' : 'disables flash'
          }
          variant="transparent"
        >
          {flash === 'off' ? (
            <BoltSlashIcon size="md" color={Colors.WHITE} />
          ) : (
            <BoltIcon size="md" color={Colors.WHITE} />
          )}
        </IconButton>
      </View>

      {/* Bottom overlay (controls) */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + Spacings.xs,
            paddingHorizontal: Spacings.md,
          },
        ]}
      >
        <TextMedium textAlign="center" mb="md" size="sm" color={Colors.WARNING}>
          PHOTO
        </TextMedium>

        <View style={styles.controlsRow}>
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
              <View style={styles.shutterOuter}>
                <View
                  style={[
                    styles.shutterInner,
                    { height: pressed ? 38 : 45, width: pressed ? 38 : 45 },
                  ]}
                />
              </View>
            )}
          </Pressable>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View style={styles.swapWrap}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BLACK, // avoids gutters behind preview
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: Spacings.md,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.BLACK,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shutterOuter: {
    backgroundColor: Colors.BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    borderWidth: 5,
    borderColor: Colors.WHITE,
    height: 60,
    width: 60,
  },
  shutterInner: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xxxl,
  },
  swapWrap: {
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xxxl,
    height: 41,
    width: 41,
  },
});
