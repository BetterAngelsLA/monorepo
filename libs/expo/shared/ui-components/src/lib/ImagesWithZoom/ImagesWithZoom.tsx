import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextMedium from '../TextMedium';

interface ImagesWithZoomProps {
  title?: string | null;
  imageUrls: { url: string }[];
  children?: React.ReactNode;
}

export function ImagesWithZoom(props: ImagesWithZoomProps) {
  const { title, imageUrls, children } = props;
  const [isVisible, setIsVisible] = useState(false);

  const insets = useSafeAreaInsets();

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
        <Pressable
          onPress={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            top: insets.top + Spacings.sm,
            right: Spacings.xxs,
            height: 40,
            width: 40,
            zIndex: 2,
          }}
          accessibilityHint="close"
          accessibilityRole="button"
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </Pressable>
        {title && (
          <View
            style={{
              position: 'absolute',
              top: insets.top + Spacings.sm,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <TextMedium size="lg">{title}</TextMedium>
          </View>
        )}
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
