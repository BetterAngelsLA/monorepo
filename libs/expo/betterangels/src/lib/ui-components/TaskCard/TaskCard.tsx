import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { TaskType } from '../../apollo';
import TaskCardBody from './TaskCardBody';
import TaskCardClient from './TaskCardClient';
import TaskCardCreatedBy from './TaskCardCreatedBy';
import TaskCardStatus from './TaskCardStatus';

type TaskCardProps = {
  task: TaskType;
};

export function TaskCard(props: TaskCardProps) {
  const { task } = props;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <TextBold size="sm" mb="sm">
          {task.summary}
        </TextBold>
        <TaskCardClient clientProfile={task.clientProfile} />
        <TaskCardCreatedBy createdBy={task.createdBy} />
        <TaskCardBody
          description={task.description}
          createdAt={task.createdAt}
        />
      </View>
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
