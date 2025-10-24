import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

interface IFieldCardProps extends TMarginProps {
  children: ReactNode;
  title: string;
  error?: string | undefined;
  expanded?: boolean;
  onPress: () => void;
  disabled?: boolean;
  overflow?: 'hidden' | 'visible' | 'scroll' | undefined;
  style?: ViewStyle;
}

export function FieldCardHmisNoteWrapper(props: IFieldCardProps) {
  const {
    children,
    title,
    error,
    expanded,
    onPress,
    disabled,
    overflow = 'hidden',
    style,
  } = props;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityHint={`expands ${title} field`}
      style={[
        styles.container,
        {
          overflow,
          borderColor:
            !!error && !!expanded ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
  },
});
