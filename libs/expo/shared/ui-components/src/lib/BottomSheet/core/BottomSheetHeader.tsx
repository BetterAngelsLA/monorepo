import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BottomSheetCloseButton } from './BottomSheetCloseButton';

export interface BottomSheetHeaderProps {
  children?: ReactNode;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
  closeBtnAccessibilityHint?: string;
}

export function BottomSheetHeader(props: BottomSheetHeaderProps) {
  const {
    children,
    onClose,
    style,
    closeBtnAccessibilityHint = 'closes bottom sheet',
  } = props;

  if (!onClose && !children) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {children && <View style={styles.content}>{children}</View>}

      {!!onClose && (
        <BottomSheetCloseButton
          style={[styles.closeBtn]}
          onClose={onClose}
          accessibilityHint={closeBtnAccessibilityHint}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacings.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  content: {
    flex: 1,
  },
  closeBtn: {
    minWidth: 0,
  },
});
