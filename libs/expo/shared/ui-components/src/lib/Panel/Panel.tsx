import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export type TPanelVariant = 'default' | 'warning' | 'error' | 'primary';

interface IPanelProps extends ViewProps {
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
  return (
    <View style={[styles.panel, VARIANTS[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: Spacings.xs,
    borderRadius: Radiuses.xs,
    borderWidth: 1,
  },
});
