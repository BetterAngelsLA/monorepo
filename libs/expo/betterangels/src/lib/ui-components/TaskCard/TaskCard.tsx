import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { TasksQuery } from '../TaskList/__generated__/Tasks.generated';
import TaskCardBody from './TaskCardBody';
import TaskCardClient from './TaskCardClient';
import TaskCardCreatedBy from './TaskCardCreatedBy';
import TaskCardStatus from './TaskCardStatus';

type TaskCardProps = {
  task: TasksQuery['tasks']['results'][number];
  onPress?: (task: TasksQuery['tasks']['results'][number]) => void;
};

export function TaskCard(props: TaskCardProps) {
  const { task, onPress } = props;

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
        {task.clientProfile && (
          <TaskCardClient clientProfile={task.clientProfile} />
        )}
        <TaskCardCreatedBy
          organization={task.organization}
          createdBy={task.createdBy}
          team={task.team}
        />
        <TaskCardBody
          description={task.description}
          createdAt={task.createdAt}
        />
      </Pressable>
      <TaskCardStatus id={task.id} status={task.status} />
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
});
