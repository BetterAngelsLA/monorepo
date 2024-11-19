import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import ImagesWithZoomHeader from './ImagesWithZoomHeader';

interface ImagesWithZoomProps {
  title?: string | null;
  imageUrls: { url: string }[];
  children?: React.ReactNode;
}

export function ImagesWithZoom(props: ImagesWithZoomProps) {
  const { title, imageUrls, children } = props;
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
        <ImagesWithZoomHeader title={title} setIsVisible={setIsVisible} />
        <ImageViewer
          backgroundColor="white"
          renderIndicator={() => <></>}
          imageUrls={imageUrls}
          onCancel={() => setIsVisible(false)}
          enableSwipeDown
        />
      </Modal>
    </>
  );
}
