import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  subtitleError?: boolean;
  required?: boolean;
};

export function FormField(props: TProps) {
  const { style, title, required, subtitle, subtitleError, children } = props;

  return (
    <View style={[styles.container, style]}>
      <View>
        <TextBold size="lg" mb="sm">
          {title}
          {required && <TextBold color={Colors.ERROR}>*</TextBold>}
        </TextBold>
        {subtitle && (
          <TextRegular
            size="sm"
            color={subtitleError ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
          >
            {subtitle}
          </TextRegular>
        )}
      </View>
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
});
