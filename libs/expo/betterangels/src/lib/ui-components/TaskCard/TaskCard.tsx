import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { TaskType } from '../../apollo';
import { formatCreatedBy } from '../../util/formatCreatedBy';
import TaskStatusBtn from '../TaskStatusBtn';
import TaskCardAssignee from './TaskCardAssignee';
import TaskCardBody from './TaskCardBody';
import TaskCardClient from './TaskCardClient';

type TaskCardVariant = 'default' | 'withoutClient';

export type TClientProfileKind = 'clientProfile' | 'hmisClientProfile';

type TaskCardProps = {
  task: TaskType;
  onPress?: (task: TaskType) => void;
  onClientPress?: (clientProfileId: string, kind: TClientProfileKind) => void;
  variant?: TaskCardVariant;
};

export function TaskCard(props: TaskCardProps) {
  const { task, onPress, onClientPress, variant = 'default' } = props;
  const { clientProfile, hmisClientProfile } = task;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        style={styles.body}
        onPress={() => onPress?.(task)}
      >
        <TextBold size="sm" mb="sm">
          {task.summary}
        </TextBold>

        {/*
          Client and assignee sit two-up as labelled people; the creator is a
          single muted line beneath them. Roles are overline captions so they
          label without competing with the names, and a task with no assignee
          simply drops that column rather than leaving a hole.
        */}
        <View style={styles.people}>
          {variant !== 'withoutClient' && clientProfile && (
            <TaskCardClient
              style={styles.person}
              firstName={clientProfile.firstName}
              lastName={clientProfile.lastName}
              profilePhotoUrl={clientProfile.profilePhoto?.url}
              onPress={
                onClientPress
                  ? () => onClientPress(clientProfile.id, 'clientProfile')
                  : undefined
              }
            />
          )}

          {variant !== 'withoutClient' && hmisClientProfile && (
            <TaskCardClient
              style={styles.person}
              firstName={hmisClientProfile.firstName}
              lastName={hmisClientProfile.lastName}
              profilePhotoUrl={hmisClientProfile.profilePhoto?.url}
              onPress={
                onClientPress
                  ? () =>
                      onClientPress(hmisClientProfile.id, 'hmisClientProfile')
                  : undefined
              }
            />
          )}

          {task.assignee && (
            <TaskCardAssignee style={styles.person} assignee={task.assignee} />
          )}
        </View>

        <TaskCardBody
          description={task.description}
          createdAt={task.createdAt}
          createdBy={formatCreatedBy(
            task.createdBy,
            task.organization,
            task.team,
          )}
        />
      </Pressable>
      <TaskStatusBtn id={task.id} status={task.status} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
  body: {
    padding: Spacings.sm,
    paddingBottom: Spacings.xxs,
  },
  people: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacings.sm,
    marginBottom: Spacings.xxs,
  },
  person: {
    flexBasis: '45%',
    flexGrow: 1,
  },
});
