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
  const [images, setImages] = useState<ReactNativeFile[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Section
        title="Upload Consent Forms"
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
        {images && images.length > 0 && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image{images.length > 1 ? 's' : ''}
            </TextBold>
            {images.map((formImage, index) => (
              <View key={index} style={{ marginBottom: Spacings.md }}>
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
                  onChangeText={(e) =>
                    setImages((prevImages) =>
                      prevImages.map((img, i) =>
                        i === index ? { ...img, name: e } : img
                      )
                    )
                  }
                />
              </View>
            ))}
          </View>
        )}
      </Section>
      <LibraryModal
        onCapture={(file) => {
          setImages((prevState) => {
            return prevState ? [...prevState, file] : [file];
          });
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setImages((prevState) => {
            return prevState ? [...prevState, ...files] : [...files];
          });
        }}
      />
    </>
  );
}
