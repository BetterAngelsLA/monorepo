import { Colors } from '@monorepo/expo/shared/static';
import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FilterTeams, FilterUsers, MainContainer } from '../../ui-components';

export default function Tasks() {
  const [selectedTeams, setSelectedTeams] = useState<TFilterOption[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<TFilterOption[]>([]);
  const [search, setSearch] = useState('');
  // selected: TFilterOption[];

  function onFiltersReset() {
    setSearch('');
  }

  // useEffect(() => {
  //   console.log(search);
  // }, [search]);

  function onFilterPress(id: string) {
    console.log('CLICK FILTER id: ', id);
  }

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      {/* <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          placeholder="Search tasks"
          onChange={(text) => {
            setSearch(text);
          }}
          onClear={() => {
            setSearch('');
          }}
          debounceMs={100}
        />
        <TextButton
          onPress={onFiltersReset}
          regular
          fontSize="sm"
          title="Reset"
          accessibilityHint="Reset filters"
        />
      </View> */}

      <Filters style={{ marginTop: 50 }}>
        <FilterUsers
          title="Filter Authors"
          onChange={setSelectedAuthors}
          selected={selectedAuthors}
        />
        <FilterTeams
          title="Filter Teams"
          onChange={setSelectedTeams}
          selected={selectedTeams}
        />
        <Filters.Button id="Clients" selected={[]} onPress={onFilterPress} />
      </Filters>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
});
