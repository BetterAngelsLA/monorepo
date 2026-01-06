import { StyleProp, ViewStyle } from 'react-native';
import { TaskFilter } from '../../apollo';
import { useTaskCount } from '../../hooks';
import { TaskCountIndictorDot } from './TaskCountIndictorDot';

type TProps = {
  filters?: TaskFilter;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function TaskCountIndictor(props: TProps) {
  const { filters, disabled, style } = props;

  const { taskCount, loading } = useTaskCount({ filters });

  if (disabled || (!taskCount && !loading)) {
    return null;
  }

  return <TaskCountIndictorDot loading={loading} style={style} />;
}
