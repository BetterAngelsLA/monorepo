import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  LibraryModal,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Image, Pressable, Switch, View } from 'react-native';
import Section from '../Section';
import { ITab } from '../types';

export default function DriverLicense({
  setTab,
}: {
  setTab: (tab: ITab) => void;
}) {
  const [isCaLicense, setIsCaLicense] = useState(false);
  const [frontImage, setFrontImage] = useState<ReactNativeFile>();
  const [backImage, setBackImage] = useState<ReactNativeFile>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadingType, setUploadingType] = useState<'front' | 'back'>('front');

  return (
    <>
      <Section
        title="Upload Driver's License"
        subtitle="You need to upload front and back of the license."
        onSubmit={() => console.log('submit')}
        setTab={setTab}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: Spacings.md,
            paddingBottom: Spacings.sm,
            marginBottom: Spacings.sm,
          }}
        >
          <TextRegular>Is this a CA Driver's License?</TextRegular>

          <Switch
            value={isCaLicense}
            onChange={() => setIsCaLicense(!isCaLicense)}
          />
        </View>
        <View
          style={{
            padding: Spacings.sm,
            paddingBottom: Spacings.lg,
            marginBottom: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacings.sm,
            borderBottomColor: Colors.NEUTRAL_LIGHT,
            borderBottomWidth: 1,
          }}
        >
          <Pressable
            onPress={() => {
              setUploadingType('front');
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <TextRegular mb="xs" size="sm">
              Front
            </TextRegular>
            <View
              style={{
                flexDirection: 'row',
                gap: Spacings.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.NEUTRAL_LIGHT,
                borderRadius: Radiuses.xs,
                height: 66,
                width: 139,
              }}
            >
              <UploadIcon size="lg" />
              <TextBold size="sm">Upload</TextBold>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              setUploadingType('back');
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
            <TextRegular mb="xs" size="sm">
              Back
            </TextRegular>
            <View
              style={{
                flexDirection: 'row',
                gap: Spacings.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.NEUTRAL_LIGHT,
                borderRadius: Radiuses.xs,
                height: 66,
                width: 139,
              }}
            >
              <UploadIcon size="lg" />
              <TextBold size="sm">Upload</TextBold>
            </View>
          </Pressable>
        </View>
        {(frontImage || backImage) && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            {frontImage && (
              <View style={{ marginBottom: Spacings.md }}>
                <TextBold size="sm">Front</TextBold>
                <Image
                  style={{
                    height: 86.5,
                    width: 129,
                    borderRadius: Radiuses.xs,
                    marginBottom: Spacings.sm,
                  }}
                  source={{ uri: frontImage.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <BasicInput
                  label="File Name"
                  value={frontImage.name}
                  onChangeText={(e) =>
                    setFrontImage({ ...frontImage, name: e })
                  }
                />
              </View>
            )}
            {backImage && (
              <View>
                <TextBold size="sm">Back</TextBold>
                <Image
                  style={{
                    height: 86.5,
                    width: 129,
                    borderRadius: Radiuses.xs,
                    marginBottom: Spacings.sm,
                  }}
                  source={{ uri: backImage.uri }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <BasicInput
                  label="File Name"
                  value={backImage.name}
                  onChangeText={(e) => setBackImage({ ...backImage, name: e })}
                />
              </View>
            )}
          </View>
        )}
      </Section>
      <LibraryModal
        allowMultiple={false}
        onCapture={(file) => {
          if (uploadingType === 'front') {
            setFrontImage(file);
          } else {
            setBackImage(file);
          }
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          if (uploadingType === 'front') {
            setFrontImage(files[0]);
          } else {
            setBackImage(files[0]);
          }
        }}
      />
    </>
  );
}
