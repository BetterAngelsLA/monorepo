import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HmisNoteType, toHmisNoteFilter } from '../../apollo';
import useUser from '../../hooks/user/useUser';
import { TUser } from '../../providers/user/UserContext';
import {
  Header,
  HorizontalContainer,
  InteractionListHmis,
  ModelFilters,
  ProgramNoteCard,
  TModelFilters,
  toModelFilterValues,
} from '../../ui-components';

const paginationLimit = 10;

function getInitialFilterValues(user?: TUser) {
  return {
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function InteractionsHmis({ Logo }: { Logo: ElementType }) {
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filtersKey, setFiltersKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<TModelFilters>(
    getInitialFilterValues(user)
  );

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
    (item: HmisNoteType) => (
      <ProgramNoteCard
        onPress={() => {
          router.navigate({
            pathname: `/notes-hmis/${item.id}`,
            params: { clientId: item.hmisClientProfile?.id },
          });
        }}
        variant="interactions"
        hmisNote={item}
      />
    ),
    []
  );

  const serverFilters = toHmisNoteFilter({
    search,
    ...toModelFilterValues(currentFilters),
  });

  return (
    <View style={styles.container}>
      <Header title="Notes" Logo={Logo} />
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
          filters={['authors']}
          style={styles.filters}
        />

        <InteractionListHmis
          filters={serverFilters}
          renderItem={renderInteractionItem}
          paginationLimit={paginationLimit}
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
});
