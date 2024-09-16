import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export function CardWrapper({
  children,
  title,
  subtitle,
  onReset,
}: {
  children: ReactNode;
  title?: string | ReactNode;
  subtitle?: string;
  onReset?: () => void;
}) {
  return (
    <View style={styles.container}>
      {title && (
        <View>
          <TextBold size="lg">{title}</TextBold>
          {subtitle && <TextRegular size="sm">{subtitle}</TextRegular>}
        </View>
      )}
      {children}
      {onReset && (
        <View style={styles.resetWrapper}>
          <TextButton
            onPress={onReset}
            color={Colors.PRIMARY}
            title="Reset"
            accessibilityHint={'resets the fields'}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacings.sm,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
  },
  resetWrapper: {
    alignItems: 'flex-end',
  },
});
