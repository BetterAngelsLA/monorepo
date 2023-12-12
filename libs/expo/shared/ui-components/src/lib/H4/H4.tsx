import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function H4({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  color = Colors.PRIMARY_EXTRA_DARK,
  align,
  spacing,
  style,
  textDecorationLine,
  onPress,
}: {
  children: ReactNode;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  color?: '#003B4F' | '#FFF82E' | '#9CDCED';
  align?: 'auto' | 'center' | 'left' | 'right' | 'justify';
  spacing?: number;
  style?: TextStyle;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.text,
        style,
        {
          textTransform,
          textAlign: align,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          textDecorationLine,
          color,
          letterSpacing: spacing,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Poppins-Semibold',
    fontSize: FontSizes.xsm.fontSize,
    lineHeight: FontSizes.xsm.lineHeight,
  },
});
