import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer, TaskStatusBtn } from '../../ui-components';
import { useUser } from '../../hooks';

import { useQuery } from '@apollo/client/react';
import TaskBody from './TaskBody';
import TaskClient from './TaskClient';
import TaskCreatedBy from './TaskCreatedBy';
import TaskHeader from './TaskHeader';
import TaskUpdatedAt from './TaskUpdatedAt';
import { TaskDocument } from './__generated__/Task.generated';

export default function Task({
  id,
  arrivedFrom,
}: {
  id: string;
  arrivedFrom?: string;
}) {
  const { data, loading, error } = useQuery(TaskDocument, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const { user } = useUser();
  const task = data?.task;
  const clientProfileId = task?.clientProfile?.id;

  const handleClientPress = useCallback(() => {
    // `/client/[id]` resolves to the HMIS client screen for HMIS users; this
    // row is a BA client, so only navigate for non-HMIS users.
    if (!clientProfileId || user?.isHmisUser) return;

    router.navigate({
      pathname: `/client/${clientProfileId}`,
      params: { arrivedFrom: `/task/${id}` },
    });
  }, [clientProfileId, id, user?.isHmisUser]);

  if (loading) {
    return <LoadingView />;
  }

  if (error) throw new Error('Something went wrong. Please try again.');
  if (!task) return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View accessibilityRole="button" style={styles.body}>
        <TaskHeader id={id} task={task} arrivedFrom={arrivedFrom} />
        <TaskUpdatedAt updatedAt={task.updatedAt} />
        <View>
          {task.clientProfile && (
            <TaskClient
              clientProfile={task.clientProfile}
              onPress={handleClientPress}
            />
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
