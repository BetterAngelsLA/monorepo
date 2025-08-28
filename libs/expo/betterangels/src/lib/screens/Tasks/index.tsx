import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HorizontalContainer, TaskCard, TaskList } from '../../ui-components';
import { TasksQuery } from './__generated__/Tasks.generated';

type TTask = TasksQuery['tasks']['results'][number];

export default function Tasks() {
  const [search, setSearch] = useState('');

  const handleTaskPress = useCallback((task: TTask) => {
    router.navigate({
      pathname: `/task/${task.id}`,
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TTask) => <TaskCard task={task} onPress={handleTaskPress} />,
    [handleTaskPress]
  );

  return (
    <View style={styles.container}>
      <HorizontalContainer>
        <SearchBar
          value={search}
          placeholder="Search tasks"
          onChange={(text) => setSearch(text)}
          onClear={() => setSearch('')}
          style={{ marginBottom: Spacings.xs }}
        />
      </HorizontalContainer>

      <TaskList filters={{ search }} renderItem={renderTaskItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingTop: Spacings.md,
  },
});
