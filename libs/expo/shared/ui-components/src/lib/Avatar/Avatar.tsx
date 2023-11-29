import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import H2 from '../H2';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IAvatarProps {
  /**
   * size:
   * sm(20) md(40) lg(60)
   */
  size?: 'sm' | 'md' | 'lg';
  firstName: string;
  lastName: string;
  imageUrl?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

export const SIZE = {
  sm: 20,
  md: 40,
  lg: 60,
} as const;

export function Avatar(props: IAvatarProps) {
  const {
    size = 'md',
    firstName,
    lastName,
    imageUrl,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
  } = props;
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
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
      }}
    >
      {imageUrl ? (
        <Image
          style={{
            height: SIZE[size],
            width: SIZE[size],
            borderRadius: 100,
            resizeMode: 'cover',
          }}
          source={{
            uri: imageUrl,
          }}
        />
      ) : (
        <H2>{firstName[0] + lastName[0]}</H2>
      )}
    </View>
  );
}
