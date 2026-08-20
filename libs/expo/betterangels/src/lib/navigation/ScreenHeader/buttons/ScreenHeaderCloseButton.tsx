import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { ScreenHeaderButton } from './ScreenHeaderButton';

type TProps = {
  onPress?: () => void;
  color?: Colors;
  accessibilityHint?: string;
  testId?: string;
};

/**
 * ScreenHeaderCloseButton
 *
 * Default right button for `ScreenHeader`'s `modal` variant: the "×" close
 * affordance, with `onPress` falling back to `router.back`.
 *
 * Icon only by design. A text affordance that happens to close — "Done", say —
 * is a different button, and is a `ScreenHeaderButton` wrapping the text
 * rather than a mode of this one.
 *
 * Owned here rather than composed from the shared `CloseButton` so the header
 * controls its own touch target and press behaviour, and has somewhere to grow
 * platform chrome. The glyph is just an icon.
 */
export function ScreenHeaderCloseButton(props?: TProps) {
  const {
    onPress,
    color = Colors.WHITE,
    accessibilityHint = 'close modal',
    testId = 'screen-header-close-btn',
  } = props || {};

  const router = useRouter();

  return (
    <ScreenHeaderButton
      onPress={onPress || router.back}
      accessibilityLabel="close"
      accessibilityHint={accessibilityHint}
      testId={testId}
    >
      <PlusIcon size="md" color={color} rotate="45deg" />
    </ScreenHeaderButton>
  );
}
