import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Parse } from 'aamva-parser';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type IDLData = {
  driversLicenseId: string;
  firstName: string;
  lastName: string;
  firstNameAlias: string;
  dateOfBirth?: Date | null;
  gender: string;
  heightInches?: number;
  weightLbs: string;
  eyeColor: string;
  streetAddress: string;
  streetAddressSupplement: string;
  city: string;
  country: string;
  postalCode: string;
};

function toCodeData(licenseData: IParsedLicense): IDLData | null {
  if (!licenseData) {
    return null;
  }

  return {
    driversLicenseId: licenseData.driversLicenseId || '',
    firstName: licenseData.firstName || '',
    lastName: licenseData.lastName || '',
    firstNameAlias: licenseData.firstNameAlias || '',
    dateOfBirth: licenseData.dateOfBirth,
    gender: licenseData.gender || '',
    heightInches: licenseData.height || 0,
    weightLbs: licenseData.weight || '',
    eyeColor: licenseData.eyeColor || '',
    streetAddress: licenseData.streetAddress || '',
    streetAddressSupplement: licenseData.streetAddressSupplement || '',
    city: licenseData.city || '',
    country: licenseData.country || '',
    postalCode: licenseData.postalCode || '',
  };
}

interface IMediaPickerModalProps {
  onCapture: (file: ReactNativeFile) => void;
  setModalVisible: (isModalVisible: boolean) => void;
  isModalVisible: boolean;
  setFiles: (files: ReactNativeFile[]) => void;
  allowMultiple?: boolean;
}

export default function MediaPickerModal(props: IMediaPickerModalProps) {
  const { setModalVisible, isModalVisible } = props;

  const camera = useCameraDevice('back');

  const [dlData, setDLData] = useState<IDLData | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  function exitCamera() {
    setIsCameraOpen(false);
  }

  const codeScanner = useCodeScanner({
    codeTypes: ['pdf-417'],
    onCodeScanned: (codes) => {
      if (codes.length && codes[0].value) {
        const codeData = codes[0].value;

        const parsedLicense = Parse(codeData);

        console.log();
        console.log('| -------------  PARSED LICENSE DATA  ------------- |');
        console.log(parsedLicense);
        console.log();

        setDLData(toCodeData(parsedLicense));

        exitCamera();

        return;
      }
    },
  });

  const closeModal = () => {
    setModalVisible(false);
  };

  const getPermissionsAndOpenCamera = async () => {
    if (hasPermission) {
      setIsCameraOpen(true);
    }

    if (!hasPermission) {
      const granted = await requestPermission();

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
      {!isCameraOpen && !!dlData && (
        <View style={{ backgroundColor: '#fff', padding: 10 }}>
          {Object.entries(dlData).map(([k, v]) => (
            <TextRegular key={k}>
              {String(k)} --- {String(v)}
            </TextRegular>
          ))}
        </View>
      )}

      {isCameraOpen && camera && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={camera}
          isActive={true}
          codeScanner={codeScanner}
        />
      )}

      {isCameraOpen && !camera && (
        <View>
          <TextRegular>CameraOpen but NO CAMERA</TextRegular>
        </View>
      )}

      {!isCameraOpen && (
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
              <TextRegular color={Colors.PRIMARY}>Scan DL Barcode</TextRegular>
            </Pressable>
          </View>
          <Pressable
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 8,
              padding: Spacings.sm,
              alignItems: 'center',
            }}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityHint="cancel"
          >
            <TextBold color={Colors.PRIMARY}>Cancel</TextBold>
          </Pressable>
        </>
      )}
    </Modal>
  );
}

interface IParsedLicense {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  expirationDate?: Date | null;
  issueDate?: Date | null;
  dateOfBirth?: Date | null;
  gender?: Gender;
  eyeColor?: EyeColor;
  height?: number | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  driversLicenseId?: string | null;
  documentId?: string | null;
  country?: IssuingCountry;
  middleNameTruncation?: Truncation;
  firstNameTruncation?: Truncation;
  lastNameTruncation?: Truncation;
  streetAddressSupplement?: string | null;
  hairColor?: HairColor;
  placeOfBirth?: string | null;
  auditInformation?: string | null;
  inventoryControlNumber?: string | null;
  lastNameAlias?: string | null;
  firstNameAlias?: string | null;
  suffixAlias?: string | null;
  suffix?: NameSuffix;
  version?: string | null;
  pdf417?: string | null;
  isExpired(): boolean;
  expired?: boolean;
  hasBeenIssued(): boolean;
  isAcceptable(): boolean;
  weight?: string;
}

enum HairColor {
  Bald = 'Bald',
  Black = 'Black',
  Blond = 'Blond',
  Brown = 'Brown',
  Grey = 'Grey',
  Red = 'Red',
  Sandy = 'Sandy',
  White = 'White',
  Unknown = 'Unknown',
}

enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
  Unknown = 'Unknown',
}

enum NameSuffix {
  Junior = 'Junior',
  Senior = 'Senior',
  First = 'First',
  Second = 'Second',
  Third = 'Third',
  Fourth = 'Fourth',
  Fifth = 'Fifth',
  Sixth = 'Sixth',
  Seventh = 'Seventh',
  Eighth = 'Eighth',
  Ninth = 'Ninth',
  Unknown = 'Unknown',
}

enum EyeColor {
  Black = 'Black',
  Blue = 'Blue',
  Brown = 'Brown',
  Gray = 'Gray',
  Green = 'Green',
  Hazel = 'Hazel',
  Maroon = 'Maroon',
  Pink = 'Pink',
  Dichromatic = 'Dichromatic',
  Unknown = 'Unknown',
}

enum IssuingCountry {
  UnitedStates = 'United States',
  Canada = 'Canada',
  Unknown = 'Unknown',
}

enum Truncation {
  Truncated = 'Truncated',
  None = 'None',
  Unknown = 'Unknown',
}
