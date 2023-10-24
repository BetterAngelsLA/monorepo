import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { GestureResponderEvent, StyleSheet, Text } from 'react-native';

export function P({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  onPress,
  textDecorationLine,
  color = colors.darkBlue,
}: {
  children: ReactNode;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
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
        {
          textTransform,
          marginBottom: mb,
          marginTop: mt,
          marginLeft: ml,
          marginRight: mr,
          marginHorizontal: mx,
          marginVertical: my,
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
