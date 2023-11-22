import { Colors, Spacings } from '@monorepo/expo/shared/static';
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
  } = props;
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.button,
        style,
        {
          backgroundColor: disabled
            ? Colors.NEUTRAL_LIGHT
            : VARIANTS[variant].bg,
          borderColor: disabled
            ? Colors.NEUTRAL_LIGHT
            : VARIANTS[variant].border,
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
