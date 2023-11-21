import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native';

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

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
          marginBottom: mb && SPACING[mb],
          marginTop: mt && SPACING[mt],
          marginLeft: ml && SPACING[ml],
          marginRight: mr && SPACING[mr],
          marginHorizontal: mx && SPACING[mx],
          marginVertical: my && SPACING[my],
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
    fontFamily: 'Pragmatica-bold',
    fontSize: 16,
    lineHeight: 24,
  },
});
