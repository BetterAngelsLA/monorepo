import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { SearchBar, TextButton } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { ElementType, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HmisNoteType } from '../../apollo';
import useUser from '../../hooks/user/useUser';
import { TUser } from '../../providers/user/UserContext';
import {
  Header,
  HorizontalContainer,
  InteractionFilters,
  InteractionListHmis,
  ProgramNoteCard,
  TInteractionFilters,
  nullInteractionFilters,
} from '../../ui-components';
import { toInteractionFilterValueHmis } from './toInteractionFilterValueHmis';

const paginationLimit = 10;

function getInitialFilterValues(user?: TUser) {
  return {
    ...nullInteractionFilters,
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  };
}

export default function InteractionsHmis({ Logo }: { Logo: ElementType }) {
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filtersKey, setFiltersKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<TInteractionFilters>(
    getInitialFilterValues(user)
  );

  function onFilterChange(selectedFilters: TInteractionFilters) {
    console.log();
    console.log(
      '| ------------- InteractionsHmis onFilterChange selectedFilters  ------------- |'
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

  const serverFilters = toInteractionFilterValueHmis({
    search,
    ...currentFilters,
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
          filters={['authors']}
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
    display: 'flex',
    flexDirection: 'row',
    gap: Spacings.xs,
    marginBottom: Spacings.sm,
  },
});

// import { useInfiniteScrollQuery } from '@monorepo/apollo';
// import { Colors } from '@monorepo/expo/shared/static';
// import { InfiniteList } from '@monorepo/expo/shared/ui-components';
// import { debounce } from '@monorepo/expo/shared/utils';
// import { router } from 'expo-router';
// import { ElementType, useCallback, useMemo, useState } from 'react';
// import { HmisNoteType } from '../../apollo';
// import { useUser } from '../../hooks';
// import {
//   Header,
//   MainScrollContainer,
//   ProgramNoteCard,
// } from '../../ui-components';
// import { DEFAULT_PAGINATION_LIMIT } from '../../ui-components/ClientProfileList/constants';
// import {
//   HmisNotesDocument,
//   HmisNotesQuery,
//   HmisNotesQueryVariables,
// } from '../ClientHMIS/tabs/ClientInteractionsHmisView/__generated__/ClientInteractionsHmisView.generated';
// import InteractionsFilters from './InteractionsFiltersHmis';
// import InteractionsHeader from './InteractionsHeaderHmis';
// type TFilters = {
//   authors: { id: string; label: string }[];
// };
// export default function InteractionsHmis({ Logo }: { Logo: ElementType }) {
//   const { user } = useUser();
//   const [search, setSearch] = useState<string>('');
//   const [filterSearch, setFilterSearch] = useState('');
//   const [filters, setFilters] = useState<TFilters>({
//     authors: user ? [{ id: user.id, label: 'Me' }] : [],
//   });

//   const updateFilters = (newFilters: TFilters) => {
//     setFilters(newFilters);
//   };
//   const onFiltersReset = () => {
//     setFilters({ authors: [] });
//     setSearch('');
//     setFilterSearch('');
//   };
//   const debounceFetch = useMemo(
//     () =>
//       debounce((text) => {
//         setFilterSearch(text);
//       }, 500),
//     []
//   );
//   const onChange = (e: string) => {
//     setSearch(e);
//     debounceFetch(e);
//   };
//   const authors = filters.authors.map((a) => a.id);
//   const { items, total, loading, hasMore, loadMore, error } =
//     useInfiniteScrollQuery<
//       HmisNoteType,
//       HmisNotesQuery,
//       HmisNotesQueryVariables
//     >({
//       document: HmisNotesDocument,
//       queryFieldName: 'hmisNotes',
//       pageSize: DEFAULT_PAGINATION_LIMIT,
//       variables: { filters: { authors, search: filterSearch } },
//       fetchPolicy: 'cache-and-network',
//       nextFetchPolicy: 'cache-first',
//     });
//   if (error) {
//     console.error(error);
//   }

//   const renderItemFn = useCallback(
//     (item: HmisNoteType) => (
//       <ProgramNoteCard
//         onPress={() => {
//           router.navigate({
//             pathname: `/notes-hmis/${item.id}`,
//             params: { clientId: item.hmisClientProfile?.id },
//           });
//         }}
//         variant="interactions"
//         hmisNote={item}
//       />
//     ),
//     []
//   );

//   return (
//     <>
//       <Header title="Notes" Logo={Logo} />
//       <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
//         <InteractionsHeader
//           onFiltersReset={onFiltersReset}
//           search={search}
//           setSearch={onChange}
//         />
//         <InteractionsFilters filters={filters} setFilters={updateFilters} />
//         <InfiniteList<HmisNoteType>
//           data={items}
//           keyExtractor={(item) => item.id ?? ''}
//           totalItems={total}
//           renderItem={renderItemFn}
//           loading={loading}
//           loadMore={loadMore}
//           hasMore={hasMore}
//           modelName="note"
//           error={!!error}
//         />
//       </MainScrollContainer>
//     </>
//   );
// }
