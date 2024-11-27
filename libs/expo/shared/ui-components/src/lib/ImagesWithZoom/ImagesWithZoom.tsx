import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ImagesWithZoomHeader from './ImagesWithZoomHeader';

interface ImagesWithZoomProps {
  title?: string | null;
  imageUrl: string;
  children?: React.ReactNode;
}

export function ImagesWithZoom(props: ImagesWithZoomProps) {
  const { title, imageUrl, children } = props;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Pressable
        accessibilityHint="opens full screen images"
        accessibilityRole="button"
        onPress={() => setIsVisible(true)}
      >
        {children}
      </Pressable>
      <Modal
        style={{
          backgroundColor: Colors.WHITE,
        }}
        visible={isVisible}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ImagesWithZoomHeader title={title} setIsVisible={setIsVisible} />
          <ImageZoom resizeMode="contain" uri={imageUrl} isDoubleTapEnabled />
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
