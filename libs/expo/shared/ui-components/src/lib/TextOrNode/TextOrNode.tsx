import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode, isValidElement } from 'react';
import {
  Linking,
  Pressable,
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
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(`mailto:${content}`)}
        android_ripple={null}
      >
        {({ pressed }) => (
          <Text
            numberOfLines={numberOfLines}
            style={[
              StyleSheet.flatten(textStyle),
              {
                textDecorationLine: 'underline',
                color: pressed
                  ? Colors.PRIMARY_LIGHT
                  : Colors.PRIMARY_EXTRA_DARK,
              },
            ]}
          >
            {content}
          </Text>
        )}
      </Pressable>
    );
  }

  if (
    isStringOrNumber &&
    isMobilePhone(content, 'any', { strictMode: false })
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(`tel:${content}`)}
        android_ripple={null}
      >
        {({ pressed }) => (
          <Text
            numberOfLines={numberOfLines}
            style={[
              StyleSheet.flatten(textStyle),
              {
                textDecorationLine: 'underline',
                color: pressed
                  ? Colors.PRIMARY_LIGHT
                  : Colors.PRIMARY_EXTRA_DARK,
              },
            ]}
          >
            {content}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Text numberOfLines={numberOfLines} style={StyleSheet.flatten(textStyle)}>
      {children}
    </Text>
  );
}
