import { Radiuses } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const BASE_MARGIN = 5;
const NUM_COLUMNS = 3;

export default function Noteimages({ images }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const totalMargin = 2 * NUM_COLUMNS * BASE_MARGIN - 2 * BASE_MARGIN;
  const imageSize = (containerWidth - totalMargin) / NUM_COLUMNS;

  return (
    <View onLayout={onLayout}>
      <View style={styles.container}>
        {images?.map((image) => (
          <Image
            style={[styles.image, { width: imageSize, height: imageSize }]}
            source={{ uri: image.file.url }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            key={image.id}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    margin: -BASE_MARGIN,
  },
  image: {
    margin: BASE_MARGIN,
    borderRadius: Radiuses.xs,
  },
});
