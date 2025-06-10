import { ReactNode, isValidElement } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { isMobilePhone } from 'validator';
import isEmail from 'validator/lib/isEmail';
import EmailBtn from '../EmailBtn';
import PhoneNumberBtn from '../PhoneNumberBtn';

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
    return <EmailBtn text={content} />;
  }

  if (
    isStringOrNumber &&
    isMobilePhone(content, 'any', { strictMode: false })
  ) {
    return <PhoneNumberBtn text={content} />;
  }

  return (
    <Text numberOfLines={numberOfLines} style={StyleSheet.flatten(textStyle)}>
      {children}
    </Text>
  );
}
