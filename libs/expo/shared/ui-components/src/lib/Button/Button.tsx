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
import Loading from '../Loading';

type TVariants = {
  [key in
    | 'primary'
    | 'primaryDark'
    | 'secondary'
    | 'negative'
    | 'sky'
    | 'dark'
    | 'black']: {
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
  md: 40,
  lg: 44,
  xl: 56,
};

const VARIANTS: TVariants = {
  black: {
    bg: Colors.BLACK,
    color: Colors.WHITE,
    border: Colors.BLACK,
  },
  primaryDark: {
    bg: Colors.PRIMARY_DARK,
    color: Colors.WHITE,
    border: Colors.PRIMARY_DARK,
  },
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
    color: Colors.WHITE,
    border: Colors.PRIMARY,
  },
  secondary: {
    bg: Colors.WHITE,
    color: Colors.PRIMARY,
    border: Colors.NEUTRAL_LIGHT,
  },
  negative: {
    bg: Colors.ERROR_EXTRA_LIGHT,
    color: Colors.ERROR_DARK,
    border: Colors.ERROR_LIGHT,
  },
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IButtonProps {
  title: string;
  size: 'sm' | 'full' | 'auto';
  onPress?: () => void;
  variant:
    | 'primary'
    | 'primaryDark'
    | 'secondary'
    | 'negative'
    | 'sky'
    | 'dark'
    | 'black';
  align?: 'flex-start' | 'center';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  fontSize?: 'sm' | 'md';
  borderColor?: string;
  accessibilityLabel?: string;
  accessibilityHint: string;
  testID?: string;
  borderRadius?: 8 | 50;
  borderWidth?: 1 | 0;
  loading?: boolean;
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
    height = 'lg',
    fontSize = 'md',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    borderColor,
    accessibilityLabel,
    testID,
    accessibilityHint,
    borderRadius = 8,
    borderWidth = 1,
    loading,
  } = props;
  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      disabled={disabled || loading}
      style={[
        styles.button,
        style,
        {
          width: SIZES[size],
          borderRadius,
          borderWidth,
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
      testID={testID}
    >
      <View style={styles.wrapper}>
        {loading ? (
          <Loading size="small" />
        ) : (
          <>
            {icon && icon}
            <Text
              style={[
                styles.text,
                {
                  color: disabled
                    ? Colors.NEUTRAL_DARK
                    : VARIANTS[variant].color,
                  marginLeft: icon ? Spacings.xs : 0,
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: FontSizes[fontSize].fontSize,
                  lineHeight: FontSizes[fontSize].lineHeight,
                },
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',

    paddingHorizontal: Spacings.xs,
  },
  text: {
    letterSpacing: 0.4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
