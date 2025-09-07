import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import { TaskQuery } from './__generated__/Task.generated';

type TTaskHeaderProps = {
  task: TaskQuery['task'];
};
export default function TaskHeader(props: TTaskHeaderProps) {
  const { task } = props;

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
        />
      ),
      title: 'Follow-Up Task',
    });
  }
  return (
    <View style={styles.container}>
      <TextRegular>{task.summary}</TextRegular>
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
