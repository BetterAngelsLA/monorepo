import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Modal from 'react-native-modal';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

interface IMediaPickerModalProps {
  onCapture: (file: ReactNativeFile) => void;
  setModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  setFiles: (files: ReactNativeFile[]) => void;
  allowMultiple?: boolean;
}

export default function MediaPickerModal(props: IMediaPickerModalProps) {
  const {
    onCapture,
    setModalVisible,
    isModalVisible,
    setFiles,
    allowMultiple = true,
  } = props;
  console.log('################################### MediaPickerModal');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  console.log('*****************  isCameraOpen:', isCameraOpen);

  // const [permission, requestPermission] = useCameraPermissions();
  const devices = useCameraDevices();

  console.log();
  console.log('| -------------  devices  ------------- |');
  console.log(devices);
  console.log();

  const camera = useCameraDevice('back');

  console.log();
  console.log('| -------------  camera  ------------- |');
  console.log(camera);
  console.log();

  const { hasPermission, requestPermission } = useCameraPermission();

  console.log('*****************  hasPermission:', hasPermission);

  const codeScanner = useCodeScanner({
    codeTypes: ['pdf-417'],
    onCodeScanned: (codes) => {
      console.log(`Scanned ${codes.length} codes!`);
    },
  });

  const closeModal = () => {
    setModalVisible(false);
  };

  const getPermissionsAndOpenCamera = async () => {
    console.log('######################### getPermissionsAndOpenCamera');

    console.log('*****************  !!camera:', !!camera);

    if (!!camera) {
      Alert.alert('CAMERA -- YES');
    }

    if (!camera) {
      Alert.alert('NO CAMERA');

      return;
    }

    if (hasPermission) {
      console.log('hasPermission');
      setIsCameraOpen(true);

      return;
    }

    if (!hasPermission) {
      console.log('hasPermission NO - so ask');

      const granted = await requestPermission();

      console.log('*****************  granted:', granted);

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

  return (
    <Modal
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      onBackdropPress={closeModal}
      isVisible={isModalVisible}
      style={{ justifyContent: 'flex-end', margin: isCameraOpen ? 0 : 20 }}
      useNativeDriverForBackdrop={true}
    >
      {!!camera && !!codeScanner && (
        <Camera
          // style={StyleSheet.absoluteFill}
          device={camera}
          isActive={true}
          // codeScanner={codeScanner}
        />
      )}

      {!camera && (
        <>
          <View
            style={{
              backgroundColor: Colors.WHITE,
              marginBottom: Spacings.xs,
              borderRadius: 8,
            }}
          >
            <Pressable
              onPress={getPermissionsAndOpenCamera}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens camera"
            >
              <TextRegular color={Colors.PRIMARY}>Take Photo</TextRegular>
            </Pressable>
          </View>
          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
              padding: Spacings.sm,
              alignItems: 'center',
            }}
            accessibilityRole="button"
            accessibilityHint="close camera selection"
            onPress={closeModal}
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </>
      )}

      {/* {isCameraOpen ? (
        <Camera
          setModalVisible={setModalVisible}
          setIsCameraOpen={setIsCameraOpen}
          onCapture={onCapture}
        />
      ) : (
        <>
          <View
            style={{
              backgroundColor: Colors.WHITE,
              marginBottom: Spacings.xs,
              borderRadius: 8,
              ...Shadow,
            }}
          >
            <Pressable
              onPress={pickImage}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderBottomWidth: 0.5,
                borderBottomColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens photo library"
            >
              <TextRegular color={Colors.PRIMARY}>From Photo Album</TextRegular>
            </Pressable>
            <Pressable
              onPress={getPermissionsAndOpenCamera}
              style={{
                padding: Spacings.sm,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: Colors.NEUTRAL_LIGHT,
              }}
              accessibilityRole="button"
              accessibilityHint="opens camera"
            >
              <TextRegular color={Colors.PRIMARY}>Take Photo</TextRegular>
            </Pressable>
          </View>
          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
              padding: Spacings.sm,
              alignItems: 'center',
              ...Shadow,
            }}
            accessibilityRole="button"
            accessibilityHint="close map selection"
            onPress={closeModal}
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </>
      )} */}
    </Modal>
  );
}
