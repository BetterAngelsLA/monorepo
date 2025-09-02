import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer } from '../../ui-components';
import { useTaskSummaryQuery } from './__generated__/TaskSummary.generated';
import TaskSummaryBody from './TaskSummaryBody';
import TaskSummaryClient from './TaskSummaryClient';
import TaskSummaryCreatedBy from './TaskSummaryCreatedBy';
import TaskSummaryHeader from './TaskSummaryHeader';
import TaskSummaryStatus from './TaskSummaryStatus';
import TaskSummaryUpdatedAt from './TaskSummaryUpdatedAt';

export default function Task({ id }: { id: string; arrivedFrom?: string }) {
  const { data, loading, error } = useTaskSummaryQuery({
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
        <TaskSummaryHeader task={task} />
        <TaskSummaryUpdatedAt updatedAt={task.updatedAt} />
        <View>
          {task.clientProfile && (
            <TaskSummaryClient clientProfile={task.clientProfile} />
          )}
          <TaskSummaryCreatedBy
            organization={task.organization}
            createdBy={task.createdBy}
            team={task.team}
          />
        </View>
        {task.description && <TaskSummaryBody description={task.description} />}
      </View>
      <TaskSummaryStatus id={task.id} status={task.status} />
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
