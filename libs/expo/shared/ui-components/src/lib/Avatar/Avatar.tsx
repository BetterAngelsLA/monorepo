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
  size?: 'sm' | 'lg' | 'xl' | '2xl';
  imageUrl?: string | null;
  hasBorder?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  headers?: Record<string, string> | null;
  alt?: string;
  /**
   * Optional: an avatar inside a control that already announces itself should
   * stay decorative, so that screen readers do not hit two elements.
   */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  borderColor?: string;
  loading?: boolean;
}

export const SIZE = {
  sm: 24,
  lg: 40,
  xl: 60,
  '2xl': 80,
} as const;

export function Avatar(props: IAvatarProps) {
  const {
    size = 'lg',
    imageUrl,
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

  const getTextComponent = (size: 'sm' | 'lg' | 'xl' | '2xl') => {
    switch (size) {
      case 'sm':
        return <UserOutlineIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'lg':
        return <UserOutlineIcon size="lg" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'xl':
        return <UserOutlineIcon size="xl" color={Colors.PRIMARY_EXTRA_DARK} />;
      case '2xl':
        return <UserOutlineIcon size="2xl" color={Colors.PRIMARY_EXTRA_DARK} />;
      default:
        return null;
    }
  };
  // Without an image the avatar is an icon, and the label used to be dropped
  // entirely — declared as a prop, passed to <Image> only in the image branch,
  // and silently discarded here. A client with no photo therefore announced
  // nothing at all, on every platform. Put the label on the wrapper in that
  // branch; with an image it stays on the <Image>, which already works.
  const labelled =
    !loading && !imageUrl && !!accessibilityLabel
      ? accessibilityLabel
      : undefined;

  return (
    <View
      accessible={!!labelled}
      accessibilityLabel={labelled}
      accessibilityHint={labelled ? accessibilityHint : undefined}
      accessibilityRole={labelled ? 'image' : undefined}
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
            cachePolicy={headers ? 'none' : 'memory-disk'}
            contentFit="cover"
            recyclingKey={imageUrl}
            // expo-image defaults the web <img> to `loading="lazy"`. In a
            // virtualized list — and on every tab switch, which remounts the
            // content — each mount is a brand new lazy image, so the avatar
            // paints blank and then fills in, which reads as flicker while
            // scrolling. Avatars are small, imgproxy serves them with a
            // one-year cache, and windowing means only the mounted rows are
            // requested anyway, so eager loading costs nothing here and removes
            // the blank frame. (The HMIS path passes `headers`, and expo-image
            // then re-fetches into a blob URL on every mount regardless — see
            // the cachePolicy above.)
            loading="eager"
            style={{
              height: SIZE[size] - 1,
              width: SIZE[size] - 1,
              borderRadius: Radiuses.xxxl,
            }}
            source={{
              uri: imageUrl,
              headers: headers ?? undefined,
            }}
          />
        )}
      </View>
    </View>
  );
}
