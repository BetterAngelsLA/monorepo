import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  DimensionValue,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type TVariants = {
  [key in 'primary' | 'secondary' | 'negative' | 'sky' | 'dark']: {
    bg: string;
    color: string;
    border: string;
  };
};

const SIZES: Record<'sm' | 'full', DimensionValue> = {
  sm: 132,
  full: '100%',
};

const VARIANTS: TVariants = {
  dark: {
    bg: colors.brandBlue,
    color: colors.white,
    border: colors.brandBlue,
  },
  sky: {
    bg: colors.brandLightBlue,
    color: colors.brandDarkBlue,
    border: colors.brandLightBlue,
  },
  primary: {
    bg: colors.blue,
    color: colors.white,
    border: colors.blue,
  },
  secondary: {
    bg: colors.lightGray,
    color: colors.blue,
    border: colors.lightGray,
  },
  negative: {
    bg: colors.white,
    color: colors.red,
    border: colors.borderRed,
  },
};

interface IButtonProps {
  title: string;
  size: 'sm' | 'full';
  onPress?: () => void;
  variant: 'primary' | 'secondary' | 'negative' | 'sky' | 'dark';
  align?: 'flex-start' | 'center';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
  fontFamily?: 'Pragmatica-medium' | 'IBM-bold';
}

export function Button(props: IButtonProps) {
  const {
    onPress,
    title,
    size,
    align = 'center',
    variant,
    disabled,
    style,
    icon,
    fontFamily = 'Pragmatica-medium',
  } = props;
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.button,
        style,
        {
          width: SIZES[size],
          alignItems: align,
          backgroundColor: disabled ? colors.disabled : VARIANTS[variant].bg,
          borderColor: disabled ? colors.disabled : VARIANTS[variant].border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.wrapper}>
        {icon && icon}
        <Text
          style={[
            styles.text,
            {
              color: disabled ? colors.darkGray : VARIANTS[variant].color,
              marginLeft: icon ? 10 : 0,
              fontFamily,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 46,
    justifyContent: 'center',
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    letterSpacing: 0.4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
