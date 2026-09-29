import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TaskType, toTaskFilter } from '../../apollo';
import { useUser } from '../../hooks';
import { useUserTeamPreference } from '../../state';
import { pagePaddingHorizontal } from '../../static';
import {
  ModelFilters,
  SortButton,
  TClientProfileKind,
  TModelFilters,
  TSortDirection,
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
  const [sortDirection, setSortDirection] =
    useState<TSortDirection>('newestFirst');

  const taskOrder = useMemo(() => getTaskOrder(sortDirection), [sortDirection]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) =>
      prev === 'newestFirst' ? 'oldestFirst' : 'newestFirst',
    );
  }, []);

  const handleTaskPress = useCallback((task: TaskType) => {
    router.navigate({
      pathname: `/task/${task.id}`,
      params: { arrivedFrom: '/tasks' },
    });
  }, []);

  const handleClientPress = useCallback(
    (clientProfileId: string, kind: TClientProfileKind) => {
      // `/client/[id]` resolves to the HMIS client screen for HMIS users, so
      // only navigate when the row's client kind matches the user's mode.
      if ((kind === 'hmisClientProfile') !== Boolean(user?.isHmisUser)) return;

      router.navigate({
        pathname: `/client/${clientProfileId}`,
        params: { arrivedFrom: '/tasks' },
      });
    },
    [user?.isHmisUser],
  );

  const renderTaskItem = useCallback(
    (task: TaskType) => (
      <TaskCard
        task={task}
        onPress={handleTaskPress}
        onClientPress={handleClientPress}
      />
    ),
    [handleTaskPress, handleClientPress],
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
            visibleTasks={visible}
            totalTasks={total ?? 0}
            actionItem={
              <SortButton
                direction={sortDirection}
                onPress={toggleSortDirection}
              />
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
  resultsHeader: {
    marginVertical: Spacings.sm,
    ...FontSizes.md,
  },
});
