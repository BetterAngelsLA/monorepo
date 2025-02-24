import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type TProps = {
  url: string;
};

export function ImageViewer(props: TProps) {
  const { url } = props;

  if (!url) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageZoom resizeMode="contain" uri={url} isDoubleTapEnabled />
    </GestureHandlerRootView>
  );
}
