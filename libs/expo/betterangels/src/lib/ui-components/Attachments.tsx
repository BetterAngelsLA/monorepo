import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  CameraPicker,
  IconButton,
  ImagePicker,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NoteNamespaceEnum } from '../apollo/gql-types/graphql';

interface IAttachmentsProps {
  images: { id: string; uri: string }[];
  setImages: React.Dispatch<
    React.SetStateAction<{ id: string; uri: string }[]>
  >;
  namespace:
    | NoteNamespaceEnum.MoodAssessment
    | NoteNamespaceEnum.ProvidedServices
    | NoteNamespaceEnum.RequestedServices;
  noteId: string | undefined;
}

export default function Attachments(props: IAttachmentsProps) {
  const { images, setImages, namespace, noteId } = props;

  const [width, setWidth] = useState(0);

  const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setWidth(width);
  };

  return (
    <View>
      <View style={styles.attach}>
        <BodyText>Attachments</BodyText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImagePicker
            noteId={noteId}
            namespace={namespace}
            mr="xs"
            setImages={setImages}
            images={images}
          />
          <CameraPicker
            namespace={namespace}
            setImages={setImages}
            images={images}
          />
        </View>
      </View>
      <View
        onLayout={onLayout}
        style={{ flexDirection: 'row', flexWrap: 'wrap' }}
      >
        {images?.map((image, idx) => (
          <View
            key={idx}
            style={{
              height: (width / 3) * 1.3 - Spacings.xs * 2,
              width: width / 3 - Spacings.xs * 2,
              margin: Spacings.xs,
              overflow: 'hidden',
            }}
          >
            <Image
              style={{ height: '100%', width: '100%' }}
              source={{ uri: image.uri }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <View
              style={{
                backgroundColor: Colors.WHITE,
                borderRadius: 100,
                position: 'absolute',
                top: 5,
                right: 5,
              }}
            >
              <IconButton
                onPress={() =>
                  setImages(images.filter((i) => i.uri !== image.uri))
                }
                variant="transparent"
                height="xs"
                width="xs"
                accessibilityLabel="delete"
                accessibilityHint="deletes the image"
              >
                <XmarkIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
              </IconButton>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attach: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 56,
    alignItems: 'center',
    marginTop: Spacings.xs,
  },
});
