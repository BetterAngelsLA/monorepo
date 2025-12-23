import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextButton } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TaskType, toTaskFilter } from '../../apollo';
import { useUser } from '../../hooks';
import { TUser } from '../../providers/user/UserContext';
import { pagePaddingHorizontal } from '../../static';
import {
  ModelFilters,
  TModelFilters,
  TaskCard,
  TaskList,
  toModelFilterValues,
} from '../../ui-components';

function getInitialFilterValues(user?: TUser): TModelFilters {
  return {
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function Tasks() {
  const { user, isHmisUser } = useUser();

  const [search, setSearch] = useState('');
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialFilterValues(user)
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
    setCurrentFilters(getInitialFilterValues(user));
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  const serverFilters = toTaskFilter({
    search,
    ...toModelFilterValues(currentFilters),
    // Tasks screen shows only tasks w/o notes
    note: { isNull: true },
    hmisNote: { isNull: true },
    hmisClientProfileLookup: isHmisUser ? undefined : { isNull: true },
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
          accessibilityHint="Reset search and filters"
        />
      </View>

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
