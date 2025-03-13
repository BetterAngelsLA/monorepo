import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface IKeyboardAwareScrollView {
  children: ReactNode;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
}

export function KeyboardAwareScrollView(props: IKeyboardAwareScrollView) {
  const { children, bottomOffset = 50, extraKeyboardSpace = 20 } = props;
  return (
    <RNKeyboardAwareScrollView
      style={{
        flex: 1,
      }}
      contentContainerStyle={styles.container}
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
    flexGrow: 1,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
  },
});
