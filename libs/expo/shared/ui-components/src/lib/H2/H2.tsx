import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
          marginBottom: mb && SPACING[mb],
          marginTop: mt && SPACING[mt],
          marginLeft: ml && SPACING[ml],
          marginRight: mr && SPACING[mr],
          marginHorizontal: mx && SPACING[mx],
          marginVertical: my && SPACING[my],
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
    color: Colors.PRIMARY_EXTRA_DARK,
    fontSize: 24,
    lineHeight: 31,
  },
});
