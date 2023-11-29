import { Colors } from '@monorepo/expo/shared/static';
import { Image, View } from 'react-native';
import H2 from '../H2';
import H4 from '../H4';

interface IAvatarProps {
  /**
   * size:
   * sm(24) md(40) lg(60)
   */
  size?: 'sm' | 'md' | 'lg';
  firstName: string;
  lastName: string;
  imageUrl?: string;
}

export const SIZE = {
  sm: 24,
  md: 40,
  lg: 60,
} as const;

export function Avatar(props: IAvatarProps) {
  const { size = 'md', firstName, lastName, imageUrl } = props;
  const initials = firstName[0] + lastName[0];

  const getTextComponent = (size: 'sm' | 'md' | 'lg') => {
    const textProps = {
      children: initials,
    };

    switch (size) {
      case 'sm':
        return <H4 {...textProps} />;
      case 'md':
      case 'lg':
        return <H2 {...textProps} />;
      default:
        return null;
    }
  };
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
        getTextComponent(size)
      )}
    </View>
  );
}
