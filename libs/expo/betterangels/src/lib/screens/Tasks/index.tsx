import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HorizontalContainer,
  MainContainer,
  TaskCard,
  TaskList,
} from '../../ui-components';
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
    <MainContainer pb={0} px={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.content}>
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
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  content: {
    flex: 1,
  },
});
