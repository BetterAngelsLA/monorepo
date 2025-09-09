import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer } from '../../ui-components';
import TaskStatusBtn from '../../ui-components/TaskStatusBtn';
import { useTaskQuery } from './__generated__/Task.generated';
import TaskBody from './TaskBody';
import TaskClient from './TaskClient';
import TaskCreatedBy from './TaskCreatedBy';
import TaskHeader from './TaskHeader';
import TaskUpdatedAt from './TaskUpdatedAt';

export default function Task({ id }: { id: string; arrivedFrom?: string }) {
  const { data, loading, error } = useTaskQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const task = data?.task;

  if (loading) {
    return <LoadingView />;
  }

  if (error) throw new Error('Something went wrong. Please try again.');
  if (!task) return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View accessibilityRole="button" style={styles.body}>
        <TaskHeader task={task} />
        <TaskUpdatedAt updatedAt={task.updatedAt} />
        <View>
          {task.clientProfile && (
            <TaskClient clientProfile={task.clientProfile} />
          )}
          <TaskCreatedBy
            organization={task.organization}
            createdBy={task.createdBy}
            team={task.team}
          />
        </View>
        {task.description && <TaskBody description={task.description} />}
      </View>
      <TaskStatusBtn id={task.id} status={task.status} />
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
    padding: Spacings.sm,
    paddingTop: Spacings.md,
    gap: Spacings.sm,
  },
});
