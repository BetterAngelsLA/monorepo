import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { HEADER_BUTTON_SIZE } from '../../constants';

type TProps = {
  onPress: () => void;

  /** Button content — a label, an icon, whatever the slot needs. */
  children: ReactNode;

  accessibilityHint: string;

  /** Required in practice for icon-only content, which has no text to read. */
  accessibilityLabel?: string;

  testId?: string;

  style?: StyleProp<ViewStyle>;
};

/**
 * ScreenHeaderButton
 *
 * The button shape every `ScreenHeader` slot should use. It owns the things
 * that must not vary between slots — touch target, vertical centring, press
 * feedback, the accessibility contract — so a text button on one side and an
 * icon button on the other line up and feel the same.
 *
 * It is a convenience, not a constraint: `ScreenHeader`'s `buttonLeft` and
 * `buttonRight` take any node. But anything rendered there without this will
 * have to re-derive the metrics, and will drift from the platform chrome this
 * is the single place to add (iOS material effects, Android ripple).
 */
export function ScreenHeaderButton(props: TProps) {
  const {
    onPress,
    children,
    accessibilityHint,
    accessibilityLabel,
    testId,
    style,
  } = props;

  return (
    <Pressable
      onPress={onPress}
      testID={testId}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: HEADER_BUTTON_SIZE,
    minHeight: HEADER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacings.xxs,
  },
  pressed: {
    opacity: 0.6,
  },
});
