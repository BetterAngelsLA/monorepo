import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type TProps = {
  text?: string;
  icon?: ReactNode;
  color?: Colors;
  disabled?: boolean;
  accessibilityHint?: string;
  onClick: () => void;
};

export function ClientNavMenuBtn(props: TProps) {
  const { text, icon, color, onClick, accessibilityHint, disabled } = props;

  if (!text && !icon) {
    return null;
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onClick}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.container,
        {
          color: color,
          backgroundColor: pressed ? Colors.GRAY_PRESSED : undefined,
        },
      ]}
    >
      <TextRegular color={color}>{text}</TextRegular>
      {icon && icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacings.sm,
    minWidth: 218,
    height: 44,
  },
});
