import { ReactNode, isValidElement } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

type TTextOrNode = {
  children: string | ReactNode;
  textStyle?: StyleProp<TextStyle>;
};

export function TextOrNode(props: TTextOrNode) {
  const { children, textStyle } = props;

  if (isValidElement(children)) {
    return children;
  }

  return <Text style={StyleSheet.flatten(textStyle)}>{children}</Text>;
}
