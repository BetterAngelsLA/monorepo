import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ListHeaderProps } from './types';

type TProps = {
  visibleTasks: number;
  totalTasks: number;
  style?: StyleProp<ViewStyle>;
  renderHeaderText?: (params: ListHeaderProps) => string;
  actionItem?: ReactNode;
};

export function TaskListHeader(props: TProps) {
  const { visibleTasks, totalTasks, renderHeaderText, style, actionItem } =
    props;

  const headerText =
    typeof renderHeaderText === 'function'
      ? renderHeaderText({ totalTasks, visibleTasks })
      : `Displaying ${visibleTasks} of ${totalTasks} tasks`;

  return (
    <View style={[styles.container, style]}>
      <TextMedium size="sm">{headerText}</TextMedium>
      {actionItem}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
