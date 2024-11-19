import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextMedium from '../TextMedium';

interface ImagesWithZoomHeaderProps {
  title?: string | null;
  setIsVisible: (isVisible: boolean) => void;
}

export default function ImagesWithZoomHeader(props: ImagesWithZoomHeaderProps) {
  const { title, setIsVisible } = props;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + Spacings.sm,
        left: 0,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}
    >
      <Pressable
        onPress={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
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
        <TextMedium style={{ maxWidth: 250 }} size="lg">
          {title}
        </TextMedium>
      )}
    </View>
  );
}
