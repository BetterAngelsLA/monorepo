import { Colors } from '@monorepo/expo/shared/static';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { TMapPinIconSize } from './MapPinIcon';
import { getFontSize } from './getFontSize';

export type TMapPinText = {
  text?: string;
  size?: TMapPinIconSize;
  subscriptAfter?: string;
  style?: StyleProp<TextStyle>;
};

export const MapPinText = (props: TMapPinText) => {
  const { text, size = 'L', subscriptAfter, style } = props;

  const { fontSize, subscriptAfterSize } = getFontSize(size, !!subscriptAfter);

  if (!text && !subscriptAfter) {
    return null;
  }

  return (
    <View style={[styles.container]}>
      {!!text && (
        <Text
          style={[
            styles.defaultText,
            {
              fontSize: fontSize,
            },
            style,
          ]}
        >
          {text}
        </Text>
      )}
      {!!subscriptAfter && (
        <Text
          style={[
            styles.defaultText,
            {
              fontSize: subscriptAfterSize,
              lineHeight: subscriptAfterSize,
            },
            style,
          ]}
        >
          {subscriptAfter}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    alignContent: 'center',
    textAlignVertical: 'center',
  },
  defaultText: {
    fontFamily: 'Poppins',
    fontWeight: 700,
    color: Colors.ERROR,
    letterSpacing: -1.5,
  },
});
