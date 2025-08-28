import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { FilterButton } from './FilterButton';

type TFilters = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  vertical?: boolean;
};

export function Filters(props: TFilters) {
  const { children, style, contentStyle, vertical } = props;

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentStyle, contentStyle]}
      showsHorizontalScrollIndicator={false}
      horizontal={!vertical}
    >
      {children}
    </ScrollView>
  );
}

Filters.Button = FilterButton;

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    // borderColor: 'red',
    // borderWidth: 8,
  },
  contentStyle: {
    gap: Spacings.xs,
    // borderColor: 'blue',
    // borderWidth: 8,
  },
});
