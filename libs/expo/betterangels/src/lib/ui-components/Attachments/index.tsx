import { Spacings } from '@monorepo/expo/shared/static';
import {
  CameraPicker,
  ImagePicker,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteNamespaceEnum } from '../../apollo/graphql/__generated__/types';
import ImageComponent from './ImageComponent';

interface IAttachmentsProps {
  images: { id: string | undefined; uri: string }[];
  setImages: (images: { id: string | undefined; uri: string }[]) => void;
  namespace:
    | NoteNamespaceEnum.MoodAssessment
    | NoteNamespaceEnum.ProvidedServices
    | NoteNamespaceEnum.RequestedServices;
  noteId: string | undefined;
}

export default function Attachments(props: IAttachmentsProps) {
  const { images, setImages, namespace, noteId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(0);

  const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setWidth(width);
  };

  return (
    <View>
      <View style={styles.attach}>
        <TextRegular>Attachments</TextRegular>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImagePicker
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            noteId={noteId}
            namespace={namespace}
            mr="xs"
            setImages={setImages}
            images={images}
          />
          <CameraPicker
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            noteId={noteId}
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
          <ImageComponent
            isLoading={isLoading}
            images={images}
            setImages={setImages}
            width={width}
            key={idx}
            image={image}
          />
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
