import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

const LINE_HEIGHT = {
  '32': 42,
  '24': 31,
};

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
  color = Colors.PRIMARY_EXTRA_DARK,
}: {
  children: ReactNode;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  fontSize?: 32 | 24;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  color?: '#F2FAFC' | '#003B4F';
}) {
  return (
    <Text
      style={[
        styles.text,
        {
          textTransform,
          fontSize,
          lineHeight: LINE_HEIGHT[fontSize],
          marginBottom: mb ? SPACING[mb] : undefined,
          marginTop: mt ? SPACING[mt] : undefined,
          marginLeft: ml ? SPACING[ml] : undefined,
          marginRight: mr ? SPACING[mr] : undefined,
          marginHorizontal: mx ? SPACING[mx] : undefined,
          marginVertical: my ? SPACING[my] : undefined,
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
