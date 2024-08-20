import { ReactNativeFile } from '@monorepo/expo/shared/apollo';
import { UploadIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  LibraryModal,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Section from '../Section';
import { ITab } from '../types';

export default function ConsentForms({
  setTab,
}: {
  setTab: (tab: ITab) => void;
}) {
  const [formImage, setFormImage] = useState<ReactNativeFile>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Section
        title="Upload Consent Form"
        // subtitle="You need to upload front and back of the license."
        onSubmit={() => console.log('submit')}
        setTab={setTab}
      >
        <View
          style={{
            padding: Spacings.sm,
            paddingBottom: Spacings.lg,
            marginBottom: Spacings.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomColor: Colors.NEUTRAL_LIGHT,
            borderBottomWidth: 1,
          }}
        >
          <Pressable
            onPress={() => {
              setIsModalVisible(true);
            }}
            accessibilityRole="button"
            style={{ alignItems: 'center' }}
          >
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
        {formImage && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            <View style={{ marginBottom: Spacings.md }}>
              <Image
                style={{
                  height: 395,
                  width: 236,
                  marginBottom: Spacings.sm,
                }}
                source={{ uri: formImage.uri }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <BasicInput
                label="File Name"
                value={formImage.name}
                onChangeText={(e) => setFormImage({ ...formImage, name: e })}
              />
            </View>
          </View>
        )}
      </Section>
      <LibraryModal
        onCapture={(file) => {
          setFormImage(file);
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        onFileSelected={(file) => {
          setFormImage(file);
        }}
      />
    </>
  );
}
