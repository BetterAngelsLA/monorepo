import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type TProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SearchBarSlot(props: TProps) {
  const { style, children } = props;

  return <View style={style}>{children}</View>;
}
