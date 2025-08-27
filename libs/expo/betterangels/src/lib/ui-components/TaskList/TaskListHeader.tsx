import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ListHeaderProps } from './types';

type TProps = {
  visibleTasks: number;
  totalTasks: number;
  style?: StyleProp<ViewStyle>;
  renderHeaderText?: (params: ListHeaderProps) => string;
};

export function TaskListHeader(props: TProps) {
  const { visibleTasks, totalTasks, renderHeaderText, style } = props;

  const headerText =
    typeof renderHeaderText === 'function'
      ? renderHeaderText({ totalTasks, visibleTasks })
      : `Displaying ${visibleTasks} of ${totalTasks} tasks`;

  return (
    <View style={[styles.container, style]}>
      <TextMedium size="sm">{headerText}</TextMedium>
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
