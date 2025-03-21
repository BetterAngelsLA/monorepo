import { TIconSize, WFEdit } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

type TProps = {
  onClick: () => void;
  style?: ViewStyle;
  accessibilityHint?: string;
  pressedColor?: Colors;
  iconSize?: TIconSize;
};

export function EditButton(props: TProps) {
  const {
    onClick,
    accessibilityHint,
    pressedColor = Colors.GRAY_PRESSED,
    iconSize = 'md',
    style,
  } = props;

  return (
    <Pressable
      onPress={onClick}
      accessible
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? pressedColor : undefined,
          ...styles.button,
        },
        style,
      ]}
      accessibilityHint={accessibilityHint || 'edit'}
      accessibilityRole="button"
    >
      <WFEdit size={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: Spacings.xl,
    height: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
