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
import { useModalScreen } from '../../../providers';
import { pagePaddingHorizontal } from '../../../static';
import { TaskCard, TaskForm, TaskList } from '../../../ui-components';
import { TasksQuery } from '../../Tasks/__generated__/Tasks.generated';
import { ClientProfileQuery } from '../__generated__/Client.generated';

type TTask = TasksQuery['tasks']['results'][number];

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function TasksTab(props: TProps) {
  const { client } = props;

  const [search, setSearch] = useState('');

  const currentPath = client
    ? `/client/${client?.clientProfile.id}?newTab=Tasks`
    : undefined;

  const handleTaskPress = useCallback((task: TTask) => {
    router.navigate({
      pathname: `/task/${task.id}`,
      params: { arrivedFrom: currentPath },
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TTask) => (
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
          clientProfileId={client?.clientProfile.id}
          onCancel={() => {
            closeModalScreen();
          }}
          onSuccess={() => {
            closeModalScreen();
          }}
          arrivedFrom={currentPath || '/tasks'}
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
        filters={{ search, clientProfile: client.clientProfile.id }}
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
