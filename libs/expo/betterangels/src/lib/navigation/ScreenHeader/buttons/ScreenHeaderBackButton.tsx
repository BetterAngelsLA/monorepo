import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ScreenHeaderButton } from './ScreenHeaderButton';

type TProps = {
  title?: string;
  color?: Colors;
  onPress?: () => void;
  accessibilityHint?: string;
  testId?: string;
};

/**
 * ScreenHeaderBackButton
 *
 * Default left button for `ScreenHeader`: a plain text label, following the
 * same pattern as `HeaderLeftButton` — no icon, and `onPress` falling back to
 * `router.back`.
 *
 * Deliberately separate from `HeaderLeftButton`, which belongs to the
 * native-header path. Keeping them apart lets this one gain in-app-only
 * behaviour without touching screens that still render native headers.
 */
export function ScreenHeaderBackButton(props?: TProps) {
  const {
    title = 'Back',
    color = Colors.WHITE,
    onPress,
    accessibilityHint = 'go to previous screen',
    testId = 'screen-header-back-btn',
  } = props || {};

  const router = useRouter();

  return (
    <ScreenHeaderButton
      onPress={onPress || router.back}
      accessibilityHint={accessibilityHint}
      testId={testId}
    >
      <TextRegular size="md" color={color}>
        {title}
      </TextRegular>
    </ScreenHeaderButton>
  );
}
