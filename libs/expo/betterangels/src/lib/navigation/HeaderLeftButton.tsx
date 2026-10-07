import { Colors } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { headerStyles } from './headerStyles';

type TProps = {
  accessibilityHint?: string;
  title?: string;
  color?: Colors;
  pressedBackgroundColor?: string;
  onPress?: () => void;
};

export function HeaderLeftButton(props?: TProps) {
  const {
    accessibilityHint = 'go to previous screen',
    color = headerStyles.primary.textColor,
    pressedBackgroundColor = headerStyles.primary.pressedBackgroundColor,
    title = 'Back',
    onPress,
  } = props || {};

  const router = useRouter();

  return (
    <TextButton
      regular
      color={color}
      fontSize="md"
      pressedBackgroundColor={pressedBackgroundColor}
      accessibilityHint={accessibilityHint}
      title={title}
      onPress={onPress || router.back}
    />
  );
}
