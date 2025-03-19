import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FormField } from './FormField';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  required?: boolean;
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

export { FormLayout };
