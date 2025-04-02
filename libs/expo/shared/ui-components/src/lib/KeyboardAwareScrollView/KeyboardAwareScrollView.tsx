import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface IKeyboardAwareScrollView {
  children: ReactNode;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  style?: ViewStyle;
}

export function KeyboardAwareScrollView(props: IKeyboardAwareScrollView) {
  const { children, bottomOffset = 50, extraKeyboardSpace = 20, style } = props;
  return (
    <RNKeyboardAwareScrollView
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </RNKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
