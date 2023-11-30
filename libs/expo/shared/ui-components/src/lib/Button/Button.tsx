import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
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

const SIZES: Record<'sm' | 'full' | 'auto', DimensionValue> = {
  sm: 132,
  full: '100%',
  auto: 'auto',
};

const HEIGHT = {
  sm: 32,
  md: 46,
};

const VARIANTS: TVariants = {
  dark: {
    bg: Colors.BRAND_STEEL_BLUE,
    color: Colors.WHITE,
    border: Colors.BRAND_STEEL_BLUE,
  },
  sky: {
    bg: Colors.BRAND_SKY_BLUE,
    color: Colors.BRAND_DARK_BLUE,
    border: Colors.BRAND_SKY_BLUE,
  },
  primary: {
    bg: Colors.PRIMARY,
    color: Colors.PRIMARY_EXTRA_DARK,
    border: Colors.PRIMARY,
  },
  secondary: {
    bg: Colors.WHITE,
    color: Colors.PRIMARY_EXTRA_DARK,
    border: Colors.NEUTRAL,
  },
  negative: {
    bg: Colors.WHITE,
    color: Colors.ERROR,
    border: Colors.ERROR,
  },
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IButtonProps {
  title: string;
  size: 'sm' | 'full' | 'auto';
  onPress?: () => void;
  variant: 'primary' | 'secondary' | 'negative' | 'sky' | 'dark';
  align?: 'flex-start' | 'center';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
  fontFamily?: 'Pragmatica-book' | 'IBM-bold';
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  height?: 'sm' | 'md';
  fontSize?: 'sm' | 'md';
  borderColor?: string;
  accLabel: string;
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
    height = 'md',
    fontSize = 'md',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    borderColor,
    accLabel,
  } = props;
  return (
    <Pressable
      accessible
      accessibilityLabel={accLabel}
      disabled={disabled}
      style={[
        styles.button,
        style,
        {
          width: SIZES[size],
          alignItems: align,
          backgroundColor: disabled
            ? Colors.NEUTRAL_LIGHT
            : VARIANTS[variant].bg,
          borderColor: disabled
            ? Colors.NEUTRAL_LIGHT
            : borderColor
            ? borderColor
            : VARIANTS[variant].border,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          height: HEIGHT[height],
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
              color: disabled ? Colors.NEUTRAL_DARK : VARIANTS[variant].color,
              marginLeft: icon ? Spacings.xs : 0,
              fontFamily,
              fontSize: FontSizes[fontSize].fontSize,
              lineHeight: FontSizes[fontSize].lineHeight,
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
    justifyContent: 'center',
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  text: {
    letterSpacing: 0.4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
