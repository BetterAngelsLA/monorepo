import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native';

const SIZES = {
  md: {
    fontSize: 16,
    lineHeight: 24,
  },
  sm: {
    fontSize: 14,
    lineHeight: 21,
  },
  xs: {
    fontSize: 11,
    lineHeight: 16.5,
  },
};

const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function BodyText({
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
  color = Colors.PRIMARY_EXTRA_DARK,
  size = 'md',
  style,
}: {
  children: ReactNode;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  color?: string;
  size?: 'md' | 'sm' | 'xs';
  style?: TextStyle;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.text,
        style,
        {
          textTransform,
          marginBottom: mb ? SPACING[mb] : undefined,
          marginTop: mt ? SPACING[mt] : undefined,
          marginLeft: ml ? SPACING[ml] : undefined,
          marginRight: mr ? SPACING[mr] : undefined,
          marginHorizontal: mx ? SPACING[mx] : undefined,
          marginVertical: my ? SPACING[my] : undefined,
          textDecorationLine,
          color,
          fontSize: SIZES[size].fontSize,
          lineHeight: SIZES[size].lineHeight,
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
  },
});
