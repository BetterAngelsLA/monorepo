import { UserOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Image } from 'expo-image';
import { View } from 'react-native';
import Loading from '../Loading';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAvatarProps {
  /**
   * size:
   * sm(24) lg(40) xl(60)
   */
  size?: 'sm' | 'lg' | 'xl';
  imageUrl?: string | null;
  /**
   * Optional cache key for the image. When the same URI can serve updated content (e.g. client
   * profile photo), pass a key that changes when content changes (e.g. URI with ?t=version) so
   * expo-image does not serve a stale cached image.
   */
  imageCacheKey?: string | null;
  hasBorder?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  headers?: Record<string, string> | null;
  alt?: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  borderColor?: string;
  loading?: boolean;
}

export const SIZE = {
  sm: 24,
  lg: 40,
  xl: 60,
} as const;

export function Avatar(props: IAvatarProps) {
  const {
    size = 'lg',
    imageUrl,
    imageCacheKey,
    headers,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    accessibilityLabel,
    accessibilityHint,
    hasBorder,
    borderColor,
    loading,
  } = props;

  const getTextComponent = (size: 'sm' | 'lg' | 'xl') => {
    switch (size) {
      case 'sm':
        return <UserOutlineIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'lg':
        return <UserOutlineIcon size="lg" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'xl':
        return <UserOutlineIcon size="xl" color={Colors.PRIMARY_EXTRA_DARK} />;
      default:
        return null;
    }
  };
  return (
    <View
      style={{
        height: SIZE[size],
        width: SIZE[size],
        borderRadius: Radiuses.xxxl,
        backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
        borderWidth: hasBorder ? 1 : 0,
        borderColor,
      }}
    >
      <View
        style={{
          borderWidth: size === 'sm' ? 1 : 0,
          borderColor: Colors.WHITE,
          borderRadius: Radiuses.xxxl,
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!!loading && <Loading />}
        {!loading && !imageUrl && getTextComponent(size)}
        {!loading && !!imageUrl && (
          <Image
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
            accessibilityHint={accessibilityHint}
            accessibilityIgnoresInvertColors
            contentFit="cover"
            style={{
              height: SIZE[size] - 1,
              width: SIZE[size] - 1,
              borderRadius: Radiuses.xxxl,
            }}
            source={{
              uri: imageUrl,
              headers: headers ?? undefined,
              ...(imageCacheKey != null && imageCacheKey !== ''
                ? { cacheKey: imageCacheKey }
                : {}),
            }}
          />
        )}
      </View>
    </View>
  );
}
