import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { pagePaddingHorizontal } from '../../static';

type TProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HorizontalContainer(props: TProps) {
  const { children, style } = props;

  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: pagePaddingHorizontal,
  },
});
