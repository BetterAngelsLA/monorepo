import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { StyleSheet } from 'react-native';
import { SelahTeamEnum, TaskFilter, TaskStatusEnum } from '../../../apollo';
import { TaskCountIndicator } from '../../TaskCountIndicator';

type TProps = {
  team: SelahTeamEnum | null;
};

export function TaskIndicator(props: TProps) {
  const { team } = props;

  if (!team) {
    return null;
  }

  const taskFilters: TaskFilter = {
    teams: [team],
    status: [TaskStatusEnum.InProgress, TaskStatusEnum.ToDo],
  };

  return (
    <TaskCountIndicator
      filters={taskFilters}
      style={styles.taskCountIndicator}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTag: {
    marginLeft: 'auto',
    backgroundColor: Colors.BRAND_SKY_BLUE,
    borderRadius: Radiuses.md,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  taskCountIndicator: {
    marginTop: 3,
  },
});
