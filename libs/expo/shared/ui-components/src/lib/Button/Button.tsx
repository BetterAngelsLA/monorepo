import { Colors } from '@monorepo/expo/shared/static';
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
    bg: Colors.BRAND_BLUE,
    color: Colors.WHITE,
    border: Colors.BRAND_BLUE,
  },
  sky: {
    bg: Colors.BRAND_LIGHT_BLUE,
    color: Colors.BRAND_DARK_BLUE,
    border: Colors.BRAND_LIGHT_BLUE,
  },
  primary: {
    bg: Colors.BLUE,
    color: Colors.WHITE,
    border: Colors.BLUE,
  },
  secondary: {
    bg: Colors.LIGHT_GRAY,
    color: Colors.DARK_BLUE,
    border: Colors.LIGHT_GRAY,
  },
  negative: {
    bg: Colors.WHITE,
    color: Colors.RED,
    border: Colors.BORDER_RED,
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
  fontFamily?: 'Pragmatica-book' | 'IBM-bold';
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
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
    fontFamily = 'Pragmatica-book',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
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
          backgroundColor: disabled ? Colors.DISABLED : VARIANTS[variant].bg,
          borderColor: disabled ? Colors.DISABLED : VARIANTS[variant].border,
          marginBottom: mb,
          marginTop: mt,
          marginLeft: ml,
          marginRight: mr,
          marginHorizontal: mx,
          marginVertical: my,
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
              color: disabled ? Colors.DARK_GRAY : VARIANTS[variant].color,
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
