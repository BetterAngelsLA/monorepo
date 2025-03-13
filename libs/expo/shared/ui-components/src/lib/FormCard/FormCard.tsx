import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import TextRegular from '../TextRegular';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  title: string;
  subtitle?: string;
  subtitleError?: boolean;
};

export function FormCard(props: TProps) {
  const { style, children, title, subtitle, subtitleError } = props;

  return (
    <View style={[styles.container, style]}>
      <View>
        <TextRegular>{title}</TextRegular>
        {subtitle && (
          <TextRegular
            mt="xs"
            size="sm"
            color={subtitleError ? Colors.ERROR : Colors.NEUTRAL}
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
    gap: Spacings.md,
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
  },
});
