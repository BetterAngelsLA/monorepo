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
    bg: '#00B3EB' | '#F1F3F3' | '#ffffff';
    color: '#ffffff' | '#102C55' | '#CB0808';
    border: '#F1F3F3' | '#DE2F2F' | '#00B3EB';
  };
};

const SIZES: Record<'sm' | 'full', DimensionValue> = {
  sm: 132,
  full: '100%',
};

const VARIANTS: TVariants = {
  primary: {
    bg: '#00B3EB', // skyBlue
    color: '#ffffff', // white
    border: '#00B3EB', // skyBlue
  },
  secondary: {
    bg: '#F1F3F3', // smoke
    color: '#102C55', // darBlue
    border: '#F1F3F3', // smoke
  },
  negative: {
    bg: '#ffffff', // white
    color: '#CB0808', // red
    border: '#DE2F2F', // borderRed
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
          backgroundColor: disabled ? '#cbd0d7' : VARIANTS[variant].bg, // disabled
          borderColor: disabled ? '#cbd0d7' : VARIANTS[variant].border, // disabled
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
              color: disabled ? '#697A87' : VARIANTS[variant].color, // darkGray
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
