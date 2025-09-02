import { EditButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useModalScreen } from '../../providers';
import { TaskForm } from '../../ui-components';
import { TaskSummaryQuery } from './__generated__/TaskSummary.generated';

type TTaskSummaryHeaderProps = {
  task: TaskSummaryQuery['task'];
  arrivedFrom?: string;
};
export default function TaskSummaryHeader(props: TTaskSummaryHeaderProps) {
  const { task, arrivedFrom } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <TaskForm
          arrivedFrom={arrivedFrom}
          clientProfileId={task?.clientProfile?.id}
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
