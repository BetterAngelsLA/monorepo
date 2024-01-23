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

interface IAttachmentsProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Attachments(props: IAttachmentsProps) {
  const { images, setImages } = props;

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
          <ImagePicker mr="xs" setImages={setImages} images={images} />
          <CameraPicker setImages={setImages} images={images} />
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
              source={{ uri: image }}
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
                  setImages(images.filter((i: string) => i !== image))
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
