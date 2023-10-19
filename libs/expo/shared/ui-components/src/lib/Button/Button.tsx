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
  [key in 'primary' | 'secondary' | 'negative']: {
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
  primary: {
    bg: colors.skyBlue,
    color: colors.white,
    border: colors.skyBlue,
  },
  secondary: {
    bg: colors.smoke,
    color: colors.darkBlue,
    border: colors.smoke,
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
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'negative';
  align?: 'flex-start' | 'center';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
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
  },
  text: {
    fontSize: 16,
    textTransform: 'capitalize',
    letterSpacing: 0.4,
    fontFamily: 'Pragmatica-medium',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
