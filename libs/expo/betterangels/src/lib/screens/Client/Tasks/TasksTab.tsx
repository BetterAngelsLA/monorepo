import { useMutation } from '@apollo/client/react';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  IconButton,
  SearchBar,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TaskType } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { pagePaddingHorizontal } from '../../../static';
import { TaskCard, TaskForm, TaskList } from '../../../ui-components';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';
import { TaskFormData } from '../../../ui-components/TaskForm/TaskForm';
import { ClientProfileQuery } from '../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function TasksTab(props: TProps) {
  const { client } = props;

  const [search, setSearch] = useState('');

  const [createTask] = useMutation(CreateTaskDocument);
  const { showSnackbar } = useSnackbar();

  const onSubmit = async (task: TaskFormData) => {
    if (!client?.clientProfile.id) return;
    try {
      const result = await createTask({
        variables: {
          data: {
            summary: task.summary!,
            description: task.description,
            status: task.status,
            team: task.team || null,
            clientProfile: client.clientProfile.id,
          },
        },
      });

      if (result.data?.createTask.__typename === 'OperationInfo') {
        console.log(result.data.createTask.messages);
      }

      closeModalScreen();
    } catch (e) {
      showSnackbar({
        message: 'Error creating a task.',
        type: 'error',
      });
      console.error(e);
    }
  };

  const currentPath = client
    ? `/client/${client?.clientProfile.id}?newTab=Tasks`
    : undefined;

  const handleTaskPress = useCallback((task: TaskType) => {
    router.navigate({
      pathname: `/task/${task.id}`,
      params: { arrivedFrom: currentPath },
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TaskType) => (
      <TaskCard task={task} onPress={handleTaskPress} variant="withoutClient" />
    ),
    [handleTaskPress]
  );

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function renderListHeaderText(visible: number, total: number | undefined) {
    return (
      <View style={styles.listHeader}>
        <TextRegular size="sm">
          Displaying {visible} of {total} tasks
        </TextRegular>

        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="open Task form"
          accessibilityHint="opens Task form"
          onPress={openTaskForm}
        >
          <PlusIcon />
        </IconButton>
      </View>
    );
  }

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <TaskForm
          onCancel={() => {
            closeModalScreen();
          }}
          onSubmit={onSubmit}
        />
      ),
      title: 'Follow-Up Task',
    });
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        placeholder="Search tasks"
        onChange={(text) => setSearch(text)}
        onClear={() => setSearch('')}
        style={{ marginBottom: Spacings.xs }}
      />

      <TaskList
        filters={{ search, clientProfile: { exact: client.clientProfile.id } }}
        renderItem={renderTaskItem}
        renderHeader={renderListHeaderText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingTop: Spacings.md,
    paddingHorizontal: pagePaddingHorizontal,
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
});
