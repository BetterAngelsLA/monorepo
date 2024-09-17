import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

type TVariants = {
  [key in
    | 'primary'
    | 'secondary'
    | 'negative'
    | 'sky'
    | 'dark'
    | 'transparent']: {
    bg: string;
    border: string;
  };
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: TVariants = {
  dark: {
    bg: Colors.BRAND_DARK_BLUE,
    border: Colors.BRAND_DARK_BLUE,
  },
  sky: {
    bg: Colors.BRAND_SKY_BLUE,
    border: Colors.BRAND_SKY_BLUE,
  },
  primary: {
    bg: Colors.PRIMARY,
    border: Colors.PRIMARY,
  },
  secondary: {
    bg: Colors.WHITE,
    border: Colors.NEUTRAL,
  },
  negative: {
    bg: Colors.WHITE,
    border: Colors.ERROR,
  },
  transparent: {
    bg: 'transparent',
    border: 'transparent',
  },
};

const Height = {
  xs: 20,
  sm: 32,
  md: 40,
} as const;

const Width = {
  xs: 20,
  sm: 32,
  md: 40,
  full: '100%',
} as const;

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
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  borderColor?: string;
  width?: 'xs' | 'md' | 'full' | 'sm';
  height?: 'xs' | 'sm' | 'md';
  accessibilityLabel: string;
  accessibilityHint: string;
  alignItems?: 'center' | 'flex-start';
  borderRadius?: number;
}

export function IconButton(props: IIconButtonProps) {
  const {
    onPress,
    variant,
    disabled,
    style,
    children,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    borderColor,
    width = 'md',
    height = 'md',
    accessibilityLabel,
    accessibilityHint,
    alignItems = 'center',
    borderRadius = Radiuses.xs,
  } = props;
  return (
    <TouchableOpacity
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      style={[
        styles.button,
        style,
        {
          height: Height[height],
          width: Width[width],
          alignItems,
          borderWidth: 1,
          borderRadius,
          backgroundColor: VARIANTS[variant].bg,
          borderColor: borderColor ? borderColor : VARIANTS[variant].border,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
  },
});
