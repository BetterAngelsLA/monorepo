import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

export type TInputSlot = {
  component: ReactNode;
  style?: ViewStyle;
  disabledStyle?: ViewStyle;
  onPress?: () => void;
  focusableInput?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

interface TProps extends TInputSlot {
  placement: 'left' | 'right';
  disabled?: boolean;
  inputRef?: React.RefObject<TextInput>;
}

export function InputSlot(props: TProps) {
  const {
    style,
    placement,
    disabledStyle,
    onPress,
    focusableInput,
    disabled,
    accessibilityLabel,
    accessibilityHint,
    component,
    inputRef,
  } = props;

  const disabledStyles = disabledStyle || { opacity: disabled ? 0.5 : 1 };
  const placementStyles =
    placement === 'left' ? styles.slotLeft : styles.slotRight;

  const slotStyle = [
    styles.container,
    { ...placementStyles },
    { ...disabledStyles },
    style,
  ];

  const handlePress = () => {
    if (disabled) {
      return;
    }

    if (focusableInput) {
      inputRef?.current?.focus();
    }

    if (onPress) {
      onPress();
    }
  };

  if (onPress || focusableInput) {
    return (
      <Pressable
        style={slotStyle}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <View>{component}</View>
      </Pressable>
    );
  }

  return <View style={slotStyle}>{component}</View>;
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  slotLeft: {
    paddingLeft: Spacings.sm,
  },
  slotRight: {
    paddingRight: Spacings.sm,
  },
});
