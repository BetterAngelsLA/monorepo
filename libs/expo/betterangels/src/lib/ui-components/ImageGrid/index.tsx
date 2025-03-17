import { Radiuses } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const BASE_MARGIN = 5;
const NUM_COLUMNS = 3;

type ImageItem = {
  id: string;
  url: string;
};

type ImageGridProps = {
  images: ImageItem[];
  numColumns?: number;
  baseMargin?: number;
};

export default function ImageGrid({
  images,
  numColumns = NUM_COLUMNS,
  baseMargin = BASE_MARGIN,
}: ImageGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const totalMargin = 2 * numColumns * baseMargin - 2 * baseMargin;
  const imageSize = (containerWidth - totalMargin) / numColumns;

  return (
    <View onLayout={onLayout}>
      <View style={[styles.container, { margin: -baseMargin }]}>
        {images?.map((image) => (
          <Image
            style={[
              styles.image,
              { width: imageSize, height: imageSize, margin: baseMargin },
            ]}
            source={{ uri: image.url }}
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
  },
  image: {
    borderRadius: Radiuses.xs,
  },
});
