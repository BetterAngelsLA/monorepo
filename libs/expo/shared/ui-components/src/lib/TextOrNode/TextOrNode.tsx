import { ReactNode, isValidElement } from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import TextRegular from '../TextRegular';

type TTextOrNode = {
  content: string | ReactNode;
  textStyle?: StyleProp<TextStyle>;
};

export function TextOrNode(props: TTextOrNode) {
  const { content, textStyle } = props;

  if (isValidElement(content)) {
    return content;
  }

  return (
    <TextRegular style={StyleSheet.flatten(textStyle)}>{content}</TextRegular>
  );
}
