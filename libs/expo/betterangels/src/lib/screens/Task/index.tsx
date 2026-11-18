import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  LoadingView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatScalarDate } from '@monorepo/shared/scalars';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer, TaskStatusBtn } from '../../ui-components';
import { useUser } from '../../hooks';

import { useQuery } from '@apollo/client/react';
import TaskAssignee from './TaskAssignee';
import TaskBody from './TaskBody';
import TaskClient from './TaskClient';
import TaskCreatedBy from './TaskCreatedBy';
import TaskHeader from './TaskHeader';
import { ShareTaskButton } from './ShareTaskButton';
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

  const taskId = task?.id;

  // A stable target keeps the effect from re-running (and the header from
  // re-rendering) on every cache update.
  const shareTarget = useMemo(() => (taskId ? { id: taskId } : null), [taskId]);

  const navigation = useNavigation();

  // Set here, not in the layout: the stack owns the header, the task data lives
  // in this screen.
  useEffect(() => {
    if (!shareTarget) return;

    navigation.setOptions({
      headerRight: () => <ShareTaskButton task={shareTarget} />,
    });
  }, [navigation, shareTarget]);

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

  if (!task) {
    // This used to be `if (!task) return null`, which draws a literally blank
    // screen — what a stale link, a deleted task, or a task outside the
    // caller's permissions looks like (BACS-128). Only a request that never
    // got an answer is a real failure worth the crash boundary: a GraphQL
    // error means the server *did* answer, and "task does not exist" is one
    // of its ordinary answers.
    //
    // Apollo types `error` as `ErrorLike`, which does not declare the field,
    // so it is read structurally rather than by cast to `ApolloError`.
    const graphQLErrors = (
      error as { graphQLErrors?: readonly unknown[] } | undefined
    )?.graphQLErrors;

    if (error && !graphQLErrors?.length) {
      throw new Error('Something went wrong. Please try again.');
    }

    return (
      <View style={styles.unavailable}>
        <TextBold size="lg">This task is not available</TextBold>
        <TextRegular size="sm" textAlign="center">
          It may have been deleted, or you may not have access to it.
        </TextRegular>
        <Button
          style={styles.unavailableButton}
          onPress={() => router.back()}
          size="full"
          fontSize="sm"
          accessibilityHint="go back"
          variant="primary"
          title="Go back"
        />
      </View>
    );
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      {/*
        No `accessibilityRole="button"` on the card: react-native-web renders that
        as a real <button>, and the client row inside it is its own press target —
        a button nested in a button is invalid HTML. This wrapper has no onPress.
      */}
      <View style={styles.body}>
        <TaskHeader id={id} task={task} arrivedFrom={arrivedFrom} />
        {/*
          Client and assignee sit two-up, as on the card: both are people the
          reader acts on, and stacking them cost two extra blocks of height.
          The creator keeps a line of its own but at caption weight.
        */}
        <View style={styles.people}>
          {task.clientProfile && (
            <TaskClient
              style={styles.person}
              clientProfile={task.clientProfile}
              onPress={handleClientPress}
            />
          )}
          {!!task.assignee && (
            <TaskAssignee style={styles.person} assignee={task.assignee} />
          )}
        </View>
        {!!task.description && <TaskBody description={task.description} />}
        {/*
          The card's footer, mirrored: attribution left, date right. Provenance
          and recency are both "where did this come from" facts, so they close
          the card instead of interrupting it between the people and the work.
        */}
        <View style={styles.footer}>
          <TaskCreatedBy
            style={styles.attribution}
            organization={task.organization}
            createdBy={task.createdBy}
            team={task.team}
          />
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK} numberOfLines={1}>
            Updated {formatScalarDate(task.updatedAt, 'MM/dd/yyyy')}
          </TextRegular>
        </View>
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
  people: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacings.sm,
  },
  person: {
    flexBasis: '45%',
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.xs,
  },
  attribution: {
    flexShrink: 1,
  },
  /**
   * The "task isn't available" fallback covers the whole screen rather than
   * sitting at the top: with no card to read, a centred message is the only
   * thing there is, and it also makes the state obviously different from a
   * screen that simply failed to paint.
   */
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  unavailableButton: {
    marginTop: Spacings.sm,
    paddingHorizontal: 40,
  },
});
