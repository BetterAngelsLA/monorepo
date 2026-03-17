import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export type TPanelVariant = 'default' | 'warning' | 'error' | 'primary';

interface IPanelProps extends PressableProps {
  children?: ReactNode;
  variant?: TPanelVariant;
}

const VARIANTS: Record<
  TPanelVariant,
  { backgroundColor: string; borderColor: string }
> = {
  default: {
    backgroundColor: Colors.WHITE,
    borderColor: Colors.NEUTRAL_LIGHT,
  },

  primary: {
    backgroundColor: Colors.PRIMARY_SUPER_LIGHT,
    borderColor: Colors.PRIMARY_EXTRA_LIGHT,
  },
  warning: {
    backgroundColor: Colors.WARNING_EXTRA_LIGHT,
    borderColor: Colors.WARNING_LIGHT,
  },
  error: {
    backgroundColor: Colors.ERROR_EXTRA_LIGHT,
    borderColor: Colors.ERROR_LIGHT,
  },
};

export function Panel({
  children,
  variant = 'default',
  style,
  ...rest
}: IPanelProps) {
  const panelStyle = (
    state: PressableStateCallbackType
  ): StyleProp<ViewStyle> => [
    styles.panel,
    VARIANTS[variant],
    typeof style === 'function' ? style(state) : style,
  ];

  return (
    <Pressable accessibilityRole="button" style={panelStyle} {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: Spacings.xs,
    borderRadius: Radiuses.xs,
    borderWidth: 1,
  },
});
