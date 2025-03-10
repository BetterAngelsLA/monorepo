import { ReactNode, isValidElement } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type TTextOrNode = {
  children: string | ReactNode;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function TextOrNode(props: TTextOrNode) {
  const { children, numberOfLines, textStyle } = props;

  if (isValidElement(children)) {
    return children;
  }

  return (
    <Text numberOfLines={numberOfLines} style={StyleSheet.flatten(textStyle)}>
      {children}
    </Text>
  );
}
