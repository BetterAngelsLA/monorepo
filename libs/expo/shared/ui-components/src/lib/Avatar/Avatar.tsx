import { UserOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Loading from '../Loading';

/**
 * The CDN re-signs the same photo on every response, so the query changes while
 * the path does not. A new URI is a new image to `expo-image`, which loads it and
 * paints the avatar blank first — the flicker when switching tabs. Keep the URI
 * we already render while the path is unchanged, and fall back to the latest one
 * if the held signature has aged out.
 */
function useStableImageUrl(imageUrl?: string | null): {
  url: string | undefined;
  adoptCurrent: () => void;
} {
  const path = imageUrl?.split('?')[0] ?? null;
  const heldPath = useRef(path);
  const latestUrl = useRef<string | undefined>(imageUrl ?? undefined);
  const [heldUrl, setHeldUrl] = useState<string | undefined>(
    imageUrl ?? undefined,
  );

  latestUrl.current = imageUrl ?? undefined;

  useEffect(() => {
    if (!imageUrl || path === heldPath.current) return;
    heldPath.current = path;
    setHeldUrl(imageUrl);
  }, [imageUrl, path]);

  const adoptCurrent = useCallback(() => {
    heldPath.current = null;
    setHeldUrl(latestUrl.current);
  }, []);

  return { url: heldUrl, adoptCurrent };
}

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

  // Stable identity for the photo, so a re-signed URI reuses the cached image
  // instead of being fetched as a new one (native; web caches by URI).
  const cacheKey = imageUrl?.split('?')[0];
  const { url: stableImageUrl, adoptCurrent } = useStableImageUrl(imageUrl);

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
  // Without an image the avatar is an icon, so the label has to go on this
  // wrapper: the <Image> that takes it is not rendered in that branch, and an
  // icon-only avatar would otherwise announce nothing.
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
            onError={adoptCurrent}
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
            accessibilityHint={accessibilityHint}
            accessibilityIgnoresInvertColors
            cachePolicy={headers ? 'none' : 'memory-disk'}
            contentFit="cover"
            recyclingKey={cacheKey}
            // Avatars are small and cached for a year, and windowing means only
            // the mounted rows ask for one, so there is nothing to defer —
            // `loading="lazy"` (expo-image's web default) just lets a fresh
            // <img> paint blank first.
            loading="eager"
            style={{
              height: SIZE[size] - 1,
              width: SIZE[size] - 1,
              borderRadius: Radiuses.xxxl,
            }}
            source={{
              uri: stableImageUrl,
              cacheKey,
              headers: headers ?? undefined,
            }}
          />
        )}
      </View>
    </View>
  );
}
