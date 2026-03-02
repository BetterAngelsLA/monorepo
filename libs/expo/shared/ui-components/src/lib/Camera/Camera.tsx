import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  BoltIcon,
  BoltSlashIcon,
  CameraRotateIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { CameraType, CameraView, FlashMode, ImageType } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '../IconButton';
import TextButton from '../TextButton';
import TextMedium from '../TextMedium';

interface CameraProps {
  onCapture: (file: ReactNativeFile) => void;
  onCancel: () => void;
  imageType?: ImageType;
}

export default function Camera(props: CameraProps) {
  const { onCapture, onCancel, imageType = 'jpg' } = props;

  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const insets = useSafeAreaInsets();

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

  async function handleCapture() {
    if (!cameraRef.current) {
      return;
    }

    if (isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync();

      if (!photo) {
        setIsCapturing(false);

        return;
      }

      const resizedPhoto = await resizeImage({ uri: photo.uri });

      const file = new ReactNativeFile({
        uri: resizedPhoto.uri,
        name: `${Date.now().toString()}.${imageType}`,
        type: `image/${imageType}`,
      });

      onCapture(file);
    } catch (error) {
      console.error(error);
      setIsCapturing(false);
    }
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={cameraType}
        flash={flashMode}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacings.xs }]}>
        <IconButton
          onPress={toggleFlash}
          accessibilityLabel="flash"
          accessibilityHint={
            flashMode === 'off' ? 'enables flash' : 'disables flash'
          }
          variant="transparent"
        >
          {flashMode === 'off' ? (
            <BoltSlashIcon size="md" color={Colors.WHITE} />
          ) : (
            <BoltIcon size="md" color={Colors.WHITE} />
          )}
        </IconButton>
      </View>

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
            onPress={onCancel}
            accessibilityHint="closes camera"
            title="Cancel"
          />

          <Pressable
            onPress={handleCapture}
            style={{ flex: 2, alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="capture"
            accessibilityHint="taka a photo"
          >
            {({ pressed }) => (
              <View style={styles.shutterOuter}>
                <View
                  style={[
                    styles.shutterInner,
                    {
                      height: pressed ? 38 : 45,
                      width: pressed ? 38 : 45,
                    },
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
