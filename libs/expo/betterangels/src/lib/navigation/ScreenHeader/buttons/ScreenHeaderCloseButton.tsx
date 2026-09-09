import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { ScreenHeaderButton } from './ScreenHeaderButton';

type TProps = {
  onPress?: () => void;
  color?: Colors;
  accessibilityHint?: string;
  testId?: string;
  /** Text label for the close button (e.g. "Done"). When set, renders a text
   *  button instead of the default "×" icon. */
  label?: string;
};

/**
 * ScreenHeaderCloseButton
 *
 * Default right button for `ScreenHeader`'s `modal` variant: the "×" close
 * affordance, with `onPress` falling back to `router.back`.
 *
 * Pass a `label` to swap the glyph for text — "Close", "Done", whatever the
 * surface needs — keeping the same shape, touch target and close behaviour.
 * A genuinely different button (not a close) is still a `ScreenHeaderButton`
 * passed to `ScreenHeader`'s `buttonRight`.
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
    label,
  } = props || {};

  const router = useRouter();

  return (
    <ScreenHeaderButton
      onPress={onPress || router.back}
      accessibilityLabel={label ?? 'close'}
      accessibilityHint={accessibilityHint}
      testId={testId}
    >
      {label && <TextBold color={color}>{label}</TextBold>}

      {!label && <PlusIcon size="md" color={color} rotate="45deg" />}
    </ScreenHeaderButton>
  );
}
