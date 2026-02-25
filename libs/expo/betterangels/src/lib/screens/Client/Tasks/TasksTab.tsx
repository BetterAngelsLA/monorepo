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
import { TaskStatusEnum, TaskType, toTaskFilter } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { useModalScreen } from '../../../providers';
import { enumDisplayTaskStatus, pagePaddingHorizontal } from '../../../static';
import {
  ModelFilters,
  TModelFilters,
  TaskCard,
  TaskForm,
  TaskList,
  toModelFilterValues,
} from '../../../ui-components';
import { TaskFormData } from '../../../ui-components/TaskForm/TaskForm';
import { CreateTaskDocument } from '../../../ui-components/TaskForm/__generated__/createTask.generated';
import { ClientProfileQuery } from '../__generated__/Client.generated';

function getInitialTaskFilters(): TModelFilters {
  return {
    taskStatus: [
      { id: TaskStatusEnum.ToDo, label: enumDisplayTaskStatus.TO_DO },
      {
        id: TaskStatusEnum.InProgress,
        label: enumDisplayTaskStatus.IN_PROGRESS,
      },
    ],
  };
}

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function TasksTab(props: TProps) {
  const { client } = props;

  const [search, setSearch] = useState('');

  const [createTask] = useMutation(CreateTaskDocument);
  const { showSnackbar } = useSnackbar();
  const { showModalScreen } = useModalScreen();

  const [filtersKey, setFiltersKey] = useState(0); // used to trigger remount
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialTaskFilters()
  );

  function onFilterChange(selectedFilters: TModelFilters) {
    setCurrentFilters(selectedFilters);
  }

  function onFilterReset() {
    const initial = getInitialTaskFilters();

    setSearch('');
    setCurrentFilters(initial);
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  const onSubmit = async (task: TaskFormData, closeForm: () => void) => {
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

      closeForm();
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
      presentation: 'fullScreenModal',
      renderContent: ({ close }) => (
        <TaskForm onCancel={close} onSubmit={(task) => onSubmit(task, close)} />
      ),
      title: 'Follow-Up Task',
    });
  }

  const serverFilters = toTaskFilter({
    search,
    ...toModelFilterValues(currentFilters),
    clientProfileLookup: { exact: client.clientProfile.id },
  });

  return (
    <View style={styles.container}>
      <SearchBar
        style={styles.searchBar}
        value={search}
        placeholder="Search tasks"
        onChange={(text) => setSearch(text)}
        onClear={() => setSearch('')}
        actionSlotRight={{
          label: 'Reset',
          accessibilityHint: 'reset search and filters',
          onPress: onFilterReset,
        }}
      />

      <ModelFilters
        style={styles.filters}
        key={filtersKey}
        selected={currentFilters}
        onChange={onFilterChange}
        filters={['teams', 'taskStatus', 'authors', 'organizations']}
      />

      <TaskList
        filters={serverFilters}
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
  searchBar: {
    marginBottom: Spacings.xs,
  },
  filters: {
    marginBottom: Spacings.sm,
  },
});
