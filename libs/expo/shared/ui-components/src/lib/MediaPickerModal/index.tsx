import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  Colors,
  MimeTypes,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { resizeImage } from '@monorepo/expo/shared/utils';
import { useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Camera from '../Camera';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface IMediaPickerModalProps {
  onCapture: (file: ReactNativeFile) => void;
  setModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  setFiles: (files: ReactNativeFile[]) => void;
  allowMultiple?: boolean;
}

const DURATION = 220;

// Helper: derive a reasonable filename without using `any`
function deriveImageName(asset: ImagePicker.ImagePickerAsset): string {
  // Some platforms expose `fileName`, but it's not in the base type
  const maybeWithName = asset as unknown as { fileName?: string };
  if (maybeWithName.fileName && maybeWithName.fileName.trim().length > 0) {
    return maybeWithName.fileName;
  }
  const fromUri = asset.uri.split('/').pop();
  return fromUri && fromUri.length > 0 ? fromUri : String(Date.now());
}

export default function MediaPickerModal({
  onCapture,
  setModalVisible,
  isModalVisible,
  setFiles,
  allowMultiple = true,
}: IMediaPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const progress = useRef(new Animated.Value(0)).current;
  const [sheetH, setSheetH] = useState(220);

  useEffect(() => {
    if (isModalVisible && !isCameraOpen) {
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    } else if (!isModalVisible) {
      progress.setValue(0);
    }
  }, [isModalVisible, isCameraOpen, progress]);

  const requestClose = useCallback(() => {
    if (isCameraOpen) {
      setIsCameraOpen(false);
      setModalVisible(false);
      return;
    }
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setModalVisible(false);
    });
  }, [isCameraOpen, progress, setModalVisible]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetH, 0],
  });

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: MimeTypes.PDF,
        multiple: allowMultiple,
      });

      if (result.canceled || !result.assets?.length) return;

      const uploaded = result.assets.map(
        (asset: DocumentPicker.DocumentPickerAsset) => {
          return new ReactNativeFile({
            uri: asset.uri,
            name: asset.name ?? String(Date.now()),
            type: asset.mimeType ?? MimeTypes.PDF,
          });
        }
      );

      setFiles(uploaded);
      requestClose();
    } catch (e) {
      console.error('DocumentPicker error:', e);
    }
  };

  const getPermissionsAndOpenCamera = async () => {
    try {
      const granted =
        permission?.granted ?? (await requestPermission()).granted;
      if (granted) {
        setIsCameraOpen(true);
      } else {
        Alert.alert(
          'Permission Denied',
          'You need to grant camera permission to use this app'
        );
      }
    } catch (e) {
      console.error('Camera permission error:', e);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: allowMultiple,
      });

      if (!result.canceled && result.assets?.length) {
        const uploaded = await Promise.all(
          result.assets.map(async (asset: ImagePicker.ImagePickerAsset) => {
            const resized = await resizeImage({ uri: asset.uri });
            return new ReactNativeFile({
              uri: resized.uri,
              name: deriveImageName(asset),
              type: asset.mimeType ?? 'image/jpeg',
            });
          })
        );
        setFiles(uploaded);
        requestClose();
      }
    } catch (e) {
      console.error('ImagePicker error:', e);
    }
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none" // fade+slide handled below
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={requestClose}
    >
      {isCameraOpen ? (
        <View style={styles.cameraContainer}>
          <Camera
            setModalVisible={setModalVisible}
            setIsCameraOpen={setIsCameraOpen}
            onCapture={(file) => {
              setIsCameraOpen(false);
              setModalVisible(false);
              onCapture(file);
            }}
          />
        </View>
      ) : (
        <>
          {/* Backdrop */}
          <TouchableWithoutFeedback
            accessibilityRole="button"
            onPress={requestClose}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: '#000', opacity: backdropOpacity },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* Bottom sheet */}
          <Animated.View
            pointerEvents="box-none"
            style={[styles.sheetContainer, { transform: [{ translateY }] }]}
            onLayout={(e) => setSheetH(e.nativeEvent.layout.height || sheetH)}
          >
            <View style={[styles.card, { paddingBottom: insets.bottom }]}>
              <Pressable
                onPress={pickImage}
                style={styles.row}
                accessibilityRole="button"
                accessibilityHint="opens photo library"
              >
                <TextRegular color={Colors.PRIMARY}>
                  From Photo Album
                </TextRegular>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                onPress={getPermissionsAndOpenCamera}
                style={styles.row}
                accessibilityRole="button"
                accessibilityHint="opens camera"
              >
                <TextRegular color={Colors.PRIMARY}>Take Photo</TextRegular>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                onPress={pickDocuments}
                style={styles.row}
                accessibilityRole="button"
                accessibilityHint="opens file library"
              >
                <TextRegular color={Colors.PRIMARY}>
                  Upload PDF file
                </TextRegular>
              </Pressable>
            </View>

            <Pressable
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityHint="close media picker"
              onPress={requestClose}
            >
              <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
            </Pressable>
          </Animated.View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  sheetContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  card: {
    backgroundColor: Colors.WHITE,
    marginBottom: Spacings.xs,
    borderRadius: 8,
    ...Shadow,
    overflow: 'hidden',
  },
  row: {
    padding: Spacings.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.NEUTRAL_LIGHT,
  },
  cancelBtn: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: Spacings.sm,
    alignItems: 'center',
    ...Shadow,
  },
});
