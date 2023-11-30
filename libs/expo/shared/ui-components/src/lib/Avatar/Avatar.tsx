import { UserIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAvatarProps {
  /**
   * size:
   * sm(24) md(40) lg(60)
   */
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  alt?: string;
  accLabel: string;
  accHint: string;
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
    accLabel,
    accHint,
  } = props;

  const getTextComponent = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return <UserIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />;
      case 'md':
      case 'lg':
        return <UserIcon color={Colors.PRIMARY_EXTRA_DARK} />;
      default:
        return null;
    }
  };
  return (
    <View
      style={{
        height: SIZE[size],
        width: SIZE[size],
        borderRadius: 100,
        backgroundColor: Colors.NEUTRAL_LIGHT,
        marginBottom: mb && Spacings[mb],
        marginTop: mt && Spacings[mt],
        marginLeft: ml && Spacings[ml],
        marginRight: mr && Spacings[mr],
        marginHorizontal: mx && Spacings[mx],
        marginVertical: my && Spacings[my],
        borderWidth: size === 'sm' ? 1 : 0,
        borderColor: Colors.PRIMARY_EXTRA_DARK,
      }}
    >
      <View
        style={{
          borderWidth: size === 'sm' ? 1 : 0,
          borderColor: Colors.WHITE,
          borderRadius: 100,
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl ? (
          <Image
            accessible
            accessibilityLabel={accLabel}
            accessibilityRole="image"
            accessibilityHint={accHint}
            accessibilityIgnoresInvertColors
            style={{
              height: SIZE[size] - 1,
              width: SIZE[size] - 1,
              borderRadius: 100,
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
