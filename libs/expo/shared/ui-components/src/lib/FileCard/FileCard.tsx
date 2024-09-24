import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Image, Pressable, View } from 'react-native';
import TextRegular from '../TextRegular';

interface IFileCardProps {
  onPress: () => void;
  filename?: string | null;
  url: string;
}

export function FileCard(props: IFileCardProps) {
  const { onPress, url, filename } = props;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: Radiuses.xs,
          borderWidth: 1,
          borderColor: Colors.NEUTRAL_LIGHT,
          paddingVertical: Spacings.sm,
          paddingHorizontal: Spacings.xs,
          gap: Spacings.xs,
          backgroundColor: pressed ? Colors.NEUTRAL_EXTRA_LIGHT : Colors.WHITE,
        },
      ]}
      accessibilityHint="opens document modal"
      accessibilityLabel="open document modal"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xs,
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <View
          style={{
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            style={{ width: 36, height: 36 }}
            source={{ uri: url }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <TextRegular numberOfLines={1} style={{ flex: 1 }} size="sm">
          {filename}
        </TextRegular>
      </View>
      <TextRegular ellipsizeMode="tail" size="xs" color={Colors.NEUTRAL_DARK}>
        11/09/23
      </TextRegular>
    </Pressable>
  );
}
