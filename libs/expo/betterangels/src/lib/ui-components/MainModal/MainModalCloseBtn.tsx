// MainModalCloseBtn.tsx
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { Pressable } from 'react-native';

type TProps = {
  onPress: () => void;
};

export function MainModalCloseBtn(props: TProps) {
  const { onPress } = props;

  return (
    <Pressable
      style={{ marginLeft: 'auto' }}
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
