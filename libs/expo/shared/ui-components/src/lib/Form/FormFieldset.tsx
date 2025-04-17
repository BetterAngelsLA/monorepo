import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { FormFieldTitle } from './FormFieldTitle';

type TProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  required?: boolean;
  style?: ViewStyle;
  titleStyle?: ViewStyle;
};

export function FormFieldset(props: TProps) {
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
    gap: Spacings.sm,
    backgroundColor: Colors.WHITE,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
    borderRadius: Radiuses.xs,
  },
  title: {
    marginBottom: Spacings.md,
  },
});
