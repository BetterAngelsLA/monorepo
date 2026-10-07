import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextMedium } from '@monorepo/expo/shared/ui-components';
import { ElementType, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteType, toNoteFilter } from '../../apollo';
import { TUser, useUser } from '../../providers/user/UserProvider';
import {
  Header,
  HorizontalContainer,
  InteractionList,
  ModelFilters,
  NoteCard,
  SortButton,
  TModelFilters,
  TSortDirection,
  toModelFilterValues,
} from '../../ui-components';
import { getInteractionOrder } from './getInteractionOrder';

const paginationLimit = 10;

function getInitialFilterValues(user?: TUser): TModelFilters {
  return {
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function Interactions({ Logo }: { Logo: ElementType }) {
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filtersKey, setFiltersKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialFilterValues(user),
  );
  const [sortDirection, setSortDirection] =
    useState<TSortDirection>('newestFirst');

  const interactionOrder = useMemo(
    () => getInteractionOrder(sortDirection),
    [sortDirection],
  );

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) =>
      prev === 'newestFirst' ? 'oldestFirst' : 'newestFirst',
    );
  }, []);

  function onFilterChange(selectedFilters: TModelFilters) {
    setCurrentFilters(selectedFilters);
  }

  function onFilterReset() {
    const initial = getInitialFilterValues(user);

    setSearch('');
    setCurrentFilters(initial);
    setFiltersKey((k) => k + 1); // inc key to trigger remount
  }

  const renderInteractionItem = useCallback(
    (interaction: NoteType) => (
      <NoteCard note={interaction} variant="interactions" />
    ),
    [],
  );

  const serverFilters = toNoteFilter({
    search,
    ...toModelFilterValues(currentFilters),
  });

  return (
    <View style={styles.container}>
      <Header title="Interactions" Logo={Logo} />
      <HorizontalContainer
        style={{
          paddingTop: Spacings.sm,
          flex: 1,
        }}
      >
        <SearchBar
          style={styles.searchRow}
          value={search}
          placeholder="Search interactions"
          onChange={(text) => setSearch(text)}
          onClear={() => setSearch('')}
          actionSlotRight={{
            label: 'Reset',
            accessibilityHint: 'Reset search and filters',
            onPress: onFilterReset,
          }}
        />

        <ModelFilters
          key={filtersKey}
          selected={currentFilters}
          onChange={onFilterChange}
          filters={['teamIds', 'authors', 'organizations']}
          style={styles.filters}
        />

        <InteractionList
          filters={serverFilters}
          order={interactionOrder}
          renderItem={renderInteractionItem}
          paginationLimit={paginationLimit}
          renderHeader={(visible, total) => (
            <View style={styles.listHeader}>
              <TextMedium size="sm">
                Displaying {visible} of {total ?? 0} interactions
              </TextMedium>
              {(total ?? 0) > 1 && (
                <SortButton
                  direction={sortDirection}
                  onPress={toggleSortDirection}
                />
              )}
            </View>
          )}
        />
      </HorizontalContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  filters: {
    marginBottom: Spacings.xl,
  },
  searchRow: {
    marginBottom: Spacings.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacings.xs,
  },
});
