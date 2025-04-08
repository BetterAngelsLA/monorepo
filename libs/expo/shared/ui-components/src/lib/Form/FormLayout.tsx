import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FormField } from './FormField';
import { FormFieldTitle } from './FormFieldTitle';
import { FormFieldset } from './FormFieldset';
import { FormPage } from './FormPage';

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

FormLayout.Page = FormPage;
FormLayout.Field = FormField;
FormLayout.FieldTitle = FormFieldTitle;
FormLayout.Fieldset = FormFieldset;

export { FormLayout };
