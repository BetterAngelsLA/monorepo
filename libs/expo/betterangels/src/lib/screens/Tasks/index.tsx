import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TaskType, toTaskFilter } from '../../apollo';
import { useUser } from '../../hooks';
import { useSortDirection, useUserTeamPreference } from '../../state';
import { pagePaddingHorizontal } from '../../static';
import {
  ModelFilters,
  SortButton,
  TModelFilters,
  TaskCard,
  TaskList,
  TaskListHeader,
  toModelFilterValues,
} from '../../ui-components';
import { getInitialTaskFilters } from './getInitialTaskFilters';
import { getTaskOrder } from './getTaskOrder';

export default function Tasks() {
  const { user } = useUser();
  const [teamPreference] = useUserTeamPreference();
  const [search, setSearch] = useState('');
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialTaskFilters({ teamId: teamPreference }),
  );
  const [filtersKey, setFiltersKey] = useState(0); // used to trigger remount
  const { direction: sortDirection, toggle: toggleSortDirection } =
    useSortDirection();

  const taskOrder = useMemo(() => getTaskOrder(sortDirection), [sortDirection]);

  const handleTaskPress = useCallback((task: TaskType) => {
    router.navigate({
      pathname: `/task/${task.id}`,
      params: { arrivedFrom: '/tasks' },
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TaskType) => <TaskCard task={task} onPress={handleTaskPress} />,
    [handleTaskPress],
  );

  function onFilterChange(selectedFilters: TModelFilters) {
    setCurrentFilters(selectedFilters);
  }

  function onFilterReset() {
    setSearch('');
    setCurrentFilters(getInitialTaskFilters({ teamId: teamPreference }));
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  const serverFilters = toTaskFilter({
    search,
    ...toModelFilterValues(currentFilters),
  });

  return (
    <View style={styles.container} testID="tasks-screen">
      <SearchBar
        style={styles.searchRow}
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
        key={filtersKey}
        selected={currentFilters}
        onChange={onFilterChange}
        style={styles.filters}
        filters={[
          user?.isHmisUser ? 'hmisClientProfiles' : 'clientProfiles',
          'teamIds',
          'taskStatus',
          'authors',
          'organizations',
        ]}
      />

      <TaskList
        filters={serverFilters}
        order={taskOrder}
        renderItem={renderTaskItem}
        renderHeader={(visible, total) => (
          <TaskListHeader
            style={styles.listHeader}
            visibleTasks={visible}
            totalTasks={total ?? 0}
            actionItem={
              (total ?? 0) > 1 ? (
                <SortButton
                  direction={sortDirection}
                  onPress={toggleSortDirection}
                />
              ) : null
            }
          />
        )}
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
  },
  filters: {
    marginBottom: Spacings.sm,
  },
  listHeader: {
    marginBottom: Spacings.xs,
  },
});
