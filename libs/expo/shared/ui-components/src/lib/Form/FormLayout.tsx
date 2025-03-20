import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FormField } from './FormField';
import { FormFieldset } from './FormFieldset';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
};

function FormLayout(props: TProps) {
  const { style, children } = props;

  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
});

FormLayout.Field = FormField;
FormLayout.Fieldset = FormFieldset;

export { FormLayout };
