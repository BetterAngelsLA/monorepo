import { colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

export function H2({
  children,
  textTransform,
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
}: {
  children: ReactNode;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: number;
  mt?: number;
  my?: number;
  mx?: number;
  ml?: number;
  mr?: number;
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
        },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'IBM-light',
    color: colors.darkBlue,
    fontSize: 24,
    lineHeight: 31,
  },
});
