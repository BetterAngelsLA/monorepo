import { Colors } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import H2 from '../H2';

interface IAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  firstName: string;
  lastName: string;
  imageUrl?: string;
}

const SIZE = {
  sm: 20,
  md: 40,
  lg: 60,
};

export function Avatar(props: IAvatarProps) {
  const { size = 'md', firstName, lastName, imageUrl } = props;
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        height: SIZE[size],
        width: SIZE[size],
        borderRadius: 100,
        backgroundColor: Colors.PRIMARY_LIGHT,
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
