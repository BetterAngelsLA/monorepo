import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ITextButtonProps {
  title: string;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  fontSize?: 'sm' | 'md';
  accessibilityLabel?: string;
  accessibilityHint: string;
  testID?: string;
  regular?: boolean;
}

export function TextButton(props: ITextButtonProps) {
  const {
    onPress,
    title,
    color = Colors.PRIMARY_EXTRA_DARK,
    disabled,
    style,
    fontSize = 'md',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    accessibilityLabel,
    testID,
    accessibilityHint,
    regular = false,
  } = props;

  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        style,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
          opacity: pressed ? 0.4 : 1,
        },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          {
            color: disabled ? Colors.NEUTRAL_DARK : color,
            fontFamily: regular ? 'Poppins-Regular' : 'Poppins-SemiBold',
            fontSize: FontSizes[fontSize].fontSize,
            lineHeight: FontSizes[fontSize].lineHeight,
          } as TextStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
