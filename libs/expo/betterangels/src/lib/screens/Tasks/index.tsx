import { Colors } from '@monorepo/expo/shared/static';
import {
  Filters,
  SearchBar,
  TFilterOption,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FilterTeams, MainContainer } from '../../ui-components';

export default function Tasks() {
  const [selectedTeams, setSelectedTeams] = useState<TFilterOption[]>([]);
  const [search, setSearch] = useState('');

  function onFiltersReset() {
    setSearch('');
  }

  useEffect(() => {
    console.log(search);
  }, [search]);

  function onFilterPress(id: string) {
    console.log('CLICK FILTER id: ', id);
  }

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          placeholder="Search tasks"
          onChange={(text) => {
            setSearch(text);
          }}
          onClear={() => {
            setSearch('');
          }}
        />
        <TextButton
          onPress={onFiltersReset}
          regular
          fontSize="sm"
          title="Reset"
          accessibilityHint="Reset filters"
        />
      </View>

      <Filters style={{ marginTop: 50 }}>
        <FilterTeams onChange={setSelectedTeams} selected={selectedTeams} />
        <Filters.Button id="Clients" selected={[]} onPress={onFilterPress} />
        <Filters.Button
          id="authors"
          selected={['hello', 'one', 'twotwotwo']}
          onPress={onFilterPress}
        />
        <Filters.Button id="status" selected={[]} onPress={onFilterPress} />
      </Filters>

      <View style={{ marginTop: 25 }}>
        <TextRegular>{search}</TextRegular>
      </View>
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
