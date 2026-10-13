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
  },
  defaultText: {
    // Must be a `useFonts` key (see FontLoader), not the bare family name —
    // `fontFamily: 'Poppins'` matches no registered face and silently falls back
    // to the system font on web.
    fontFamily: 'Poppins-SemiBold',
    color: Colors.ERROR,
    letterSpacing: -1.5,
    includeFontPadding: false, // android
  },
});
