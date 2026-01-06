import { StyleProp, ViewStyle } from 'react-native';
import { TaskFilter } from '../../apollo';
import { useTaskCount } from '../../hooks';
import { TaskCountIndictorDot } from './TaskCountIndictorDot';

type TProps = {
  filters?: TaskFilter;
  style?: StyleProp<ViewStyle>;
};

export function TaskCountIndictor(props: TProps) {
  const { filters, style } = props;

  const { taskCount, loading } = useTaskCount({ filters });

  if (!taskCount && !loading) {
    return null;
  }

  return <TaskCountIndictorDot loading={loading} style={style} />;
}
