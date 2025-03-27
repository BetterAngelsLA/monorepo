import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FormFieldTitle } from './FormFieldTitle';

type TProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  style?: ViewStyle;
  titleStyle?: ViewStyle;
  required?: boolean;
};

export function FormField(props: TProps) {
  const {
    style,
    titleStyle,
    title,
    required,
    subtitle,
    subtitleError,
    children,
  } = props;

  return (
    <View style={[styles.container, style]}>
      <FormFieldTitle
        title={title}
        subtitle={subtitle}
        subtitleError={subtitleError}
        required={required}
        style={[styles.title, titleStyle]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: Radiuses.xs,
  },
  title: {
    marginBottom: Spacings.sm,
  },
});
