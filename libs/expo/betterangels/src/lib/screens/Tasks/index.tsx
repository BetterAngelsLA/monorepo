import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import {
  SearchBar,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUser } from '../../hooks';
import { TUser } from '../../providers/user/UserContext';
import { pagePaddingHorizontal } from '../../static';
import {
  TTaskFilters,
  TaskCard,
  TaskFilters,
  TaskList,
  nullTaskFilters,
  toTaskFilterValue,
} from '../../ui-components';
import { TasksQuery } from './__generated__/Tasks.generated';

type TTask = TasksQuery['tasks']['results'][number];

function getInitialFilterValues(user?: TUser) {
  return {
    ...nullTaskFilters,
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function Tasks() {
  const { user } = useUser();

  const [search, setSearch] = useState('');
  const [filtersKey, setFiltersKey] = useState(0);

  const [currentFilters, setCurrentFilters] = useState<TTaskFilters>(
    getInitialFilterValues(user)
  );

  const handleTaskPress = useCallback((task: TTask) => {
    router.navigate({
      pathname: `/task/${task.id}`,
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TTask) => <TaskCard task={task} onPress={handleTaskPress} />,
    [handleTaskPress]
  );

  function onFilterChange(selectedFilters: TTaskFilters) {
    setCurrentFilters(selectedFilters);
  }

  function onFilterReset() {
    setSearch('');
    const initial = getInitialFilterValues(user);
    setCurrentFilters(initial);
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  function renderListHeader(visible: number, _total: number | undefined) {
    return (
      <View style={styles.resultsHeader}>
        <TextRegular>{visible} Tasks total</TextRegular>
      </View>
    );
  }

  const serverFilters = toTaskFilterValue({
    search,
    ...currentFilters,
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          placeholder="Search tasks"
          onChange={(text) => setSearch(text)}
          onClear={() => setSearch('')}
          style={{ flexGrow: 1 }}
        />
        <TextButton
          onPress={onFilterReset}
          regular
          title="Reset"
          accessibilityHint="Reset filters"
        />
      </View>

      <TaskFilters
        key={filtersKey}
        selected={currentFilters}
        onChange={onFilterChange}
        style={styles.filters}
      />

      <TaskList
        filters={serverFilters}
        renderItem={renderTaskItem}
        renderHeader={renderListHeader}
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
  searchRow: {
    marginBottom: Spacings.xs,
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.sm,
  },
  filters: {
    marginBottom: Spacings.sm,
  },
  resultsHeader: {
    marginVertical: Spacings.sm,
    ...FontSizes.md,
  },
});
