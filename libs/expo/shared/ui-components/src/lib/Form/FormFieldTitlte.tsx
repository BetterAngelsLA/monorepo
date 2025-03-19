import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  required?: boolean;
};

export function FormFieldTitlte(props: TProps) {
  const { style, title, required, subtitle, subtitleError } = props;

  if (!title && !subtitle) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {!!title && (
        <TextBold size="lg">
          {title}
          {required && <TextBold color={Colors.ERROR}>*</TextBold>}
        </TextBold>
      )}

      {!!subtitle && (
        <TextRegular
          size="sm"
          color={subtitleError ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
        >
          {subtitle}
        </TextRegular>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacings.sm,
  },
});
