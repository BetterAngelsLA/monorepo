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

export default function Attachments() {
  const [images, setImages] = useState<Array<string>>([]);

  return (
    <View>
      <View style={styles.attach}>
        <BodyText>Attachments</BodyText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ImagePicker mr="xs" setImages={setImages} images={images} />
          <CameraPicker setImages={setImages} images={images} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {images.map((image, idx) => (
          <View
            key={idx}
            style={{
              height: 82,
              width: 60,
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
            <IconButton
              onPress={() =>
                setImages(images.filter((i: string) => i !== image))
              }
              style={{ position: 'absolute', top: 5, right: 5 }}
              variant="secondary"
              height="xs"
              width="xs"
              accessibilityLabel="delete"
              accessibilityHint="deletes the image"
            >
              <XmarkIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
            </IconButton>
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
