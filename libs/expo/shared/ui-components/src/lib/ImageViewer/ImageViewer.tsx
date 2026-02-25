import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type TProps = {
  url: string;
  /** Optional headers for authenticated image requests (e.g. HMIS photo) */
  headers?: Record<string, string> | null;
};

export function ImageViewer(props: TProps) {
  const { url, headers } = props;

  if (!url) {
    return null;
  }

  const source = headers
    ? { uri: url, headers }
    : { uri: url };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageZoom
        resizeMode="contain"
        source={source}
        uri={url}
        isDoubleTapEnabled
      />
    </GestureHandlerRootView>
  );
}
