import { StyleProp, ViewStyle } from 'react-native';
import { TaskFilter } from '../../apollo';
import { useTaskCount } from '../../hooks';
import { TaskCountIndicatorDot } from './TaskCountIndicatorDot';

type TProps = {
  filters?: TaskFilter;
  style?: StyleProp<ViewStyle>;
};

export function TaskCountIndicator(props: TProps) {
  const { filters, style } = props;

  const { taskCount, loading } = useTaskCount({ filters });

  if (!taskCount && !loading) {
    return null;
  }

  return <TaskCountIndicatorDot loading={loading} style={style} />;
}
