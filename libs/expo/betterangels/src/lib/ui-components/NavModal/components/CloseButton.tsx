import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Pressable, ViewStyle } from 'react-native';

type TProps = {
  onPress: () => void;
  style?: ViewStyle;
};

export function CloseButton(props: TProps) {
  const { onPress, style } = props;

  return (
    <Pressable
      style={style}
      accessible
      accessibilityHint="closes the modal"
      accessibilityRole="button"
      accessibilityLabel="close"
      onPress={onPress}
    >
      <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
    </Pressable>
  );
}
