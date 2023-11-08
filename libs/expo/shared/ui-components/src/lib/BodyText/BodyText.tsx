import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { GestureResponderEvent, StyleSheet, Text } from 'react-native';

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
  color = Colors.DARK_BLUE,
  fontSize = 'md',
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
  color?: string;
  fontSize?: 'md' | 'sm' | 'xs';
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
          fontSize: SIZES[fontSize].fontSize,
          lineHeight: SIZES[fontSize].lineHeight,
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
