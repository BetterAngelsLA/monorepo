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

export default function SocialSecurity({
  setTab,
}: {
  setTab: (tab: ITab) => void;
}) {
  const [image, setImage] = useState<ReactNativeFile>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Section
        title="Upload Social Security Card"
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
        {image && (
          <View style={{ paddingTop: Spacings.sm }}>
            <TextBold mb="sm" size="md">
              Uploaded Image
            </TextBold>
            <View style={{ marginBottom: Spacings.md }}>
              <Image
                style={{
                  height: 86.5,
                  width: 129,
                  borderRadius: Radiuses.xs,
                  marginBottom: Spacings.sm,
                }}
                source={{ uri: image.uri }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <BasicInput
                label="File Name"
                value={image.name}
                onChangeText={(e) => setImage({ ...image, name: e })}
              />
            </View>
          </View>
        )}
      </Section>
      <LibraryModal
        allowMultiple={false}
        onCapture={(file) => {
          setImage(file);
        }}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => {
          setImage(files[0]);
        }}
      />
    </>
  );
}
