import { Colors } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';

type TProps = {
  accessibilityHint?: string;
  title?: string;
  color?: Colors;
  onPress?: () => void;
};

export function HeaderLeftButton(props?: TProps) {
  const {
    accessibilityHint = 'go to previous screen',
    color = Colors.WHITE,
    title = 'Back',
    onPress,
  } = props || {};

  const router = useRouter();

  return (
    <TextButton
      regular
      color={color}
      fontSize="md"
      accessibilityHint={accessibilityHint}
      title={title}
      onPress={onPress || router.back}
    />
  );
}
