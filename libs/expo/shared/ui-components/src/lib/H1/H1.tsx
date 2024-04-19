import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function H1({
  children,
  textTransform,
  size = 'xl',
  mb,
  mt,
  mr,
  ml,
  my,
  mx,
  color = Colors.PRIMARY_EXTRA_DARK,
}: {
  children: ReactNode;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  size?: 'xl' | '2xl';
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  color?: '#F2FAFC' | '#052B73' | '#ffffff';
}) {
  return (
    <Text
      style={[
        styles.text,
        {
          textTransform,
          fontSize: FontSizes[size].fontSize,
          lineHeight: FontSizes[size].lineHeight,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
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
    fontFamily: 'Poppins-SemiBold',
  },
});
