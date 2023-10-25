import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

export function H4({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  color = colors.darkBlue,
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
}) {
  return (
    <Text
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
    fontFamily: 'Pragmatica-bold',
    fontSize: 16,
    lineHeight: 24,
  },
});
