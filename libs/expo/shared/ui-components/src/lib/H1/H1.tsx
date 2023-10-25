import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

const LINE_HEIGHT = {
  '32': 42,
  '24': 31,
};

export function H1({
  children,
  textTransform,
  fontSize = 24,
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
  fontSize?: 32 | 24;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
  color?: '#F2FAFC' | '#102C55';
}) {
  return (
    <Text
      style={[
        styles.text,
        {
          textTransform,
          fontSize,
          lineHeight: LINE_HEIGHT[fontSize],
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
    fontFamily: 'IBM-bold',
  },
});
