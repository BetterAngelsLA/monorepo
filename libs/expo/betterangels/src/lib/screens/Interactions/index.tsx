import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextButton } from '@monorepo/expo/shared/ui-components';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteType } from '../../apollo';
import useUser from '../../hooks/user/useUser';
import { TUser } from '../../providers/user/UserContext';
import {
  Header,
  HorizontalContainer,
  InteractionFilters,
  InteractionList,
  NoteCard,
  TInteractionFilters,
  nullInteractionFilters,
} from '../../ui-components';
import { toInteractionFilterValue } from './toInteractionFilterValue';

const paginationLimit = 10;

function getInitialFilterValues(user?: TUser) {
  return {
    ...nullInteractionFilters,
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function Interactions({ Logo }: { Logo: ElementType }) {
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filtersKey, setFiltersKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<TInteractionFilters>(
    getInitialFilterValues(user)
  );

  function onFilterChange(selectedFilters: TInteractionFilters) {
    console.log();
    console.log(
      '| ------------- BA onFilterChange selectedFilters  ------------- |'
    );
    console.log(JSON.stringify(selectedFilters, null, 2));
    console.log();
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
    []
  );

  // const serverFilters = toInteractionFilterValue({
  //   search,
  //   ...currentFilters,
  // });

  return (
    <View style={styles.container}>
      <Header title="Interactions" Logo={Logo} />
      <HorizontalContainer
        style={{
          paddingTop: Spacings.sm,
          flex: 1,
        }}
      >
        <View style={styles.searchRow}>
          <SearchBar
            value={search}
            placeholder="Search interactions"
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

        <InteractionFilters
          style={styles.filters}
          key={filtersKey}
          selected={currentFilters}
          onChange={onFilterChange}
          // filters={['organizations', 'authors']}
        />

        <InteractionList
          // filters={serverFilters}
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
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.xs,
    marginBottom: Spacings.sm,
  },
});
