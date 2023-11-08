import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native';

export function BodyText({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  py,
  px,
  onPress,
  textDecorationLine,
  color = colors.darkBlue,
  style,
}: {
  children: ReactNode;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  py?: number;
  px?: number;
  mr?: number;
  style?: TextStyle;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  color?: '#ffffff' | '#102C55' | '#9CDCED';
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.text,
        style,
        {
          textTransform,
          marginBottom: mb,
          marginTop: mt,
          marginLeft: ml,
          marginRight: mr,
          marginHorizontal: mx,
          marginVertical: my,
          paddingHorizontal: px,
          paddingVertical: py,
          textDecorationLine,
          color,
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Pragmatica-book',
    fontSize: 16,
    lineHeight: 24,
  },
});
