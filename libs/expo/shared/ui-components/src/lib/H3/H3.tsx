import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function H3({
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
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}) {
  return (
    <Text
      style={[
        styles.text,
        {
          textTransform,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
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
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: FontSizes.md.fontSize,
    lineHeight: FontSizes.md.lineHeight,
  },
});
