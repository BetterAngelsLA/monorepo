import { ReactNode } from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import TextRegular from '../TextRegular';

interface TProps {
  label?: ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function CheckboxLabel(props: TProps) {
  const { label, style, labelStyle } = props;

  const isStringLabel = typeof label === 'string';

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {!isStringLabel && label}

      {!!isStringLabel && (
        <TextRegular style={labelStyle} numberOfLines={2} ellipsizeMode="tail">
          {label}
        </TextRegular>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
});
