import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

type TVariants = {
  [key in
    | 'primary'
    | 'secondary'
    | 'negative'
    | 'sky'
    | 'dark'
    | 'transparent']: {
    bg: string;
  };
};

const VARIANTS: TVariants = {
  dark: {
    bg: colors.brandBlue,
  },
  sky: {
    bg: colors.brandLightBlue,
  },
  primary: {
    bg: colors.blue,
  },
  secondary: {
    bg: colors.lightGray,
  },
  negative: {
    bg: colors.white,
  },
  transparent: {
    bg: 'transparent',
  },
};

interface IIconButtonProps {
  onPress?: () => void;
  variant:
    | 'primary'
    | 'secondary'
    | 'negative'
    | 'sky'
    | 'dark'
    | 'transparent';
  disabled?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}

export function IconButton(props: IIconButtonProps) {
  const { onPress, variant, disabled, style, children } = props;
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.button,
        style,
        {
          backgroundColor: disabled ? colors.disabled : VARIANTS[variant].bg,
        },
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
