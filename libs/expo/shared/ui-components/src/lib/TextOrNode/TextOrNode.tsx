import { ReactNode, isValidElement } from 'react';
import {
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { isMobilePhone } from 'validator';
import isEmail from 'validator/lib/isEmail';

type TTextOrNode = {
  children: string | ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function TextOrNode(props: TTextOrNode) {
  const { children, numberOfLines, textStyle } = props;

  if (isValidElement(children)) {
    return children;
  }

  const isStringOrNumber =
    typeof children === 'string' || typeof children === 'number';
  const content = isStringOrNumber ? String(children) : '';

  if (isStringOrNumber && isEmail(content)) {
    return (
      <Text
        numberOfLines={numberOfLines}
        style={StyleSheet.flatten(textStyle)}
        onPress={() => Linking.openURL(`mailto:${content}`)}
      >
        {content}
      </Text>
    );
  }

  if (
    isStringOrNumber &&
    isMobilePhone(content, 'any', { strictMode: false })
  ) {
    return (
      <Text
        numberOfLines={numberOfLines}
        style={StyleSheet.flatten(textStyle)}
        onPress={() => Linking.openURL(`tel:${content}`)}
      >
        {content}
      </Text>
    );
  }

  return (
    <Text numberOfLines={numberOfLines} style={StyleSheet.flatten(textStyle)}>
      {children}
    </Text>
  );
}
