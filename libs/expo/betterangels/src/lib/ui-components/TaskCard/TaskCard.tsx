import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { TaskType } from '../../apollo';
import TaskStatusBtn from '../TaskStatusBtn';
import TaskCardBody from './TaskCardBody';
import TaskCardClient from './TaskCardClient';
import TaskCardCreatedBy from './TaskCardCreatedBy';

type TaskCardVariant = 'default' | 'withoutClient';

type TaskCardProps = {
  task: TaskType;
  onPress?: (task: TaskType) => void;
  variant?: TaskCardVariant;
};

export function TaskCard(props: TaskCardProps) {
  const { task, onPress, variant = 'default' } = props;

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

        {variant !== 'withoutClient' && task.clientProfile && (
          <TaskCardClient
            firstName={task.clientProfile.firstName}
            lastName={task.clientProfile.lastName}
            profilePhotoUrl={task.clientProfile.profilePhoto?.url}
          />
        )}

        {variant !== 'withoutClient' && task.hmisClientProfile && (
          <TaskCardClient
            firstName={task.hmisClientProfile.firstName}
            lastName={task.hmisClientProfile.lastName}
            profilePhotoUrl={task.hmisClientProfile.profilePhoto?.url}
          />
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
});
