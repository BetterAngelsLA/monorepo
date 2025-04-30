import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, forwardRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface IKeyboardAwareScrollView {
  children: ReactNode;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
}

export const KeyboardAwareScrollView = forwardRef<
  ScrollView,
  IKeyboardAwareScrollView
>((props: IKeyboardAwareScrollView, ref) => {
  const { children, bottomOffset = 50, extraKeyboardSpace = 20 } = props;

  return (
    <RNKeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
      keyboardShouldPersistTaps="handled"
      ref={ref}
    >
      {children}
    </RNKeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
