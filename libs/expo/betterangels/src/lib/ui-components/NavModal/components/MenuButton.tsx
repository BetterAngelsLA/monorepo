import { BarsIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Pressable } from 'react-native';

type TProps = {
  onPress: () => void;
};

export function MenuButton(props: TProps) {
  const { onPress } = props;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="opens main navigation modal"
    >
      <BarsIcon size={'xl'} color={Colors.WHITE} />
    </Pressable>
  );
}
