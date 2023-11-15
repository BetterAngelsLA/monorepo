import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

export function H4({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  color = Colors.DARK_BLUE,
  align,
  spacing,
  style,
}: {
  children: ReactNode;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
  color?: '#102C55' | '#FFF82E';
  align?: 'auto' | 'center' | 'left' | 'right' | 'justify';
  spacing?: number;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[
        styles.text,
        style,
        {
          textTransform,
          textAlign: align,
          marginBottom: mb,
          marginTop: mt,
          marginLeft: ml,
          marginRight: mr,
          marginHorizontal: mx,
          marginVertical: my,
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
