import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TaskType, toTaskFilter } from '../../apollo';
import { useUser } from '../../hooks';
import { useUserTeamPreference } from '../../state';
import { pagePaddingHorizontal } from '../../static';
import {
  ModelFilters,
  TModelFilters,
  TaskCard,
  TaskList,
  toModelFilterValues,
} from '../../ui-components';
import { getInitialTaskFilters } from './getInitialTaskFilters';

export default function Tasks() {
  const { isHmisUser } = useUser();
  const [teamPreference] = useUserTeamPreference();
  const [search, setSearch] = useState('');
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialTaskFilters({ teamPreference })
  );
  const [filtersKey, setFiltersKey] = useState(0); // used to trigger remount

  const handleTaskPress = useCallback((task: TaskType) => {
    router.navigate({
      pathname: `/task/${task.id}`,
      params: { arrivedFrom: '/tasks' },
    });
  }, []);

  const renderTaskItem = useCallback(
    (task: TaskType) => <TaskCard task={task} onPress={handleTaskPress} />,
    [handleTaskPress]
  );

  function onFilterChange(selectedFilters: TModelFilters) {
    setCurrentFilters(selectedFilters);
  }

  function onFilterReset() {
    setSearch('');
    setCurrentFilters(getInitialTaskFilters({ teamPreference }));
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  const serverFilters = toTaskFilter({
    search,
    ...toModelFilterValues(currentFilters),
  });

  return (
    <View style={styles.container}>
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
          isHmisUser ? 'hmisClientProfiles' : 'clientProfiles',
          'teams',
          'taskStatus',
          'authors',
          'organizations',
        ]}
      />

      <TaskList filters={serverFilters} renderItem={renderTaskItem} />
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
