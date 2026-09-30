import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { TaskType } from '../../apollo';
import TaskStatusBtn from '../TaskStatusBtn';
import TaskCardBody from './TaskCardBody';
import TaskCardClient from './TaskCardClient';
import TaskCardCreatedBy from './TaskCardCreatedBy';

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

        {variant !== 'withoutClient' && clientProfile && (
          <TaskCardClient
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
            firstName={hmisClientProfile.firstName}
            lastName={hmisClientProfile.lastName}
            profilePhotoUrl={hmisClientProfile.profilePhoto?.url}
            onPress={
              onClientPress
                ? () => onClientPress(hmisClientProfile.id, 'hmisClientProfile')
                : undefined
            }
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
