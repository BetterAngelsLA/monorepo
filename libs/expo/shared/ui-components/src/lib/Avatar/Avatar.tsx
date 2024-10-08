import { UserOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAvatarProps {
  /**
   * size:
   * sm(24) md(40) lg(60)
   */
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  hasBorder?: boolean;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  alt?: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  borderColor?: string;
}

export const SIZE = {
  sm: 24,
  md: 40,
  lg: 60,
} as const;

export function Avatar(props: IAvatarProps) {
  const {
    size = 'md',
    imageUrl,
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
  } = props;

  const getTextComponent = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return <UserOutlineIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'md':
      case 'lg':
        return <UserOutlineIcon color={Colors.PRIMARY_EXTRA_DARK} />;
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
        {imageUrl ? (
          <Image
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
            accessibilityHint={accessibilityHint}
            accessibilityIgnoresInvertColors
            style={{
              height: SIZE[size] - 1,
              width: SIZE[size] - 1,
              borderRadius: Radiuses.xxxl,
              resizeMode: 'cover',
            }}
            source={{
              uri: imageUrl,
            }}
          />
        ) : (
          getTextComponent(size)
        )}
      </View>
    </View>
  );
}
