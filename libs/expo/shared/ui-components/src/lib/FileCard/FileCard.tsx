import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

interface IFileCardProps {
  onPress: () => void;
  thumbnail?: ReactNode;
  filename?: string | null;
  url: string;
  createdAt: string;
}

export function FileCard(props: IFileCardProps) {
  const { onPress, url, filename, createdAt, thumbnail } = props;

  const content = (
    <>
      <View style={styles.leading}>
        <View style={styles.thumbnail}>
          {!!thumbnail && thumbnail}
          {!thumbnail && (
            <Image
              style={{ width: 36, height: 36 }}
              source={{ uri: url }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          )}
        </View>
        <View style={styles.meta}>
          <TextRegular numberOfLines={1} size="sm">
            {filename}
          </TextRegular>
        </View>
      </View>

      <TextRegular ellipsizeMode="tail" size="xs" color={Colors.NEUTRAL_DARK}>
        {format(new Date(createdAt), 'MM/dd/yyyy')}
      </TextRegular>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityHint="opens document modal"
      accessibilityLabel="open document modal"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radiuses.xs,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    gap: Spacings.xs,
    backgroundColor: Colors.WHITE,
  },
  pressed: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    overflow: 'hidden',
    flex: 1,
  },
  thumbnail: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: Spacings.xxs,
  },
});
