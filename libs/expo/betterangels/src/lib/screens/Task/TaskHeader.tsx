import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import { TaskQuery } from './__generated__/Task.generated';

type TSearchParams = {
  arrivedFrom?: string;
};

type TTaskHeaderProps = {
  task: TaskQuery['task'];
};

export default function TaskHeader(props: TTaskHeaderProps) {
  const { task } = props;

  const { arrivedFrom } = useLocalSearchParams<TSearchParams>();

  const currentPath = arrivedFrom || '/tasks';

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <TaskForm
          clientProfileId={task.clientProfile?.id}
          task={task}
          onCancel={() => {
            closeModalScreen();
          }}
          onSuccess={() => {
            closeModalScreen();
          }}
          arrivedFrom={currentPath}
        />
      ),
      title: 'Follow-Up Task',
    });
  }
  return (
    <View style={styles.container}>
      <TextRegular style={{ flex: 1 }}>{task.summary}</TextRegular>
      <EditButton iconSize="md" onClick={openTaskForm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
