import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import KeyboardAwareScrollView from '../KeyboardAwareScrollView';
import { FormButtons, TFormButtons } from './FormButtons';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  actionProps?: TFormButtons;
};

export function FormPage(props: TProps) {
  const { actionProps, style, children } = props;

  return (
    <View style={[styles.container, style]}>
      <KeyboardAwareScrollView>{children}</KeyboardAwareScrollView>

      {!!actionProps && <FormButtons {...actionProps} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
});
