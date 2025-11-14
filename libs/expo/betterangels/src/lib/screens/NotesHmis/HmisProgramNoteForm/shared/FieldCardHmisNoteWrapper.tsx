import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
} from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface IFieldCardProps extends TMarginProps {
  children: ReactNode;
  title: string;
  error?: string | undefined;
  expanded?: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
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
    loading,
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
      {loading && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.loading]}
        >
          <Loading />
        </View>
      )}

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
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
});
