import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import KeyboardAwareScrollView from '../KeyboardAwareScrollView';
import { FormButtons, TFormButtons } from './FormButtons';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  actionProps?: TFormButtons;
  scrollViewRef?: RefObject<ScrollView | null>;
};

export function FormPage(props: TProps) {
  const { actionProps, style, scrollViewRef, children } = props;

  return (
    <View style={[styles.container, style]}>
      <KeyboardAwareScrollView ref={scrollViewRef}>
        {children}
      </KeyboardAwareScrollView>

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
