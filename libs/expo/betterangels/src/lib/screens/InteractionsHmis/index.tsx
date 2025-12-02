import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Colors } from '@monorepo/expo/shared/static';
import { InfiniteList } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { HmisNoteType } from '../../apollo';
import { useUser } from '../../hooks';
import { MainScrollContainer, ProgramNoteCard } from '../../ui-components';
import { DEFAULT_PAGINATION_LIMIT } from '../../ui-components/ClientProfileList/constants';
import {
  HmisNotesDocument,
  HmisNotesQuery,
  HmisNotesQueryVariables,
} from '../ClientHMIS/tabs/ClientInteractionsHmisView/__generated__/ClientInteractionsHmisView.generated';
import InteractionsFilters from './InteractionsFiltersHmis';
import InteractionsHeader from './InteractionsHeaderHmis';
type TFilters = {
  authors: { id: string; label: string }[];
};
export default function InteractionsHmis() {
  const { user } = useUser();
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filters, setFilters] = useState<TFilters>({
    authors: user ? [{ id: user.id, label: 'Me' }] : [],
  });

  const updateFilters = (newFilters: TFilters) => {
    setFilters(newFilters);
  };
  const onFiltersReset = () => {
    setFilters({ authors: [] });
    setSearch('');
    setFilterSearch('');
  };
  const debounceFetch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
      }, 500),
    []
  );
  const onChange = (e: string) => {
    setSearch(e);
    debounceFetch(e);
  };
  const authors = filters.authors.map((a) => a.id);
  const { items, total, loading, hasMore, loadMore, error } =
    useInfiniteScrollQuery<
      HmisNoteType,
      HmisNotesQuery,
      HmisNotesQueryVariables
    >({
      document: HmisNotesDocument,
      queryFieldName: 'hmisNotes',
      pageSize: DEFAULT_PAGINATION_LIMIT,
      variables: { filters: { authors, search: filterSearch } },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    });
  if (error) {
    console.error(error);
  }

  const renderItemFn = useCallback(
    (item: HmisNoteType) => (
      <ProgramNoteCard
        onPress={() => {
          router.navigate({
            pathname: `/notes-hmis/${item.id}`,
          });
        }}
        variant="interactions"
        hmisNote={item}
      />
    ),
    []
  );

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionsHeader
        onFiltersReset={onFiltersReset}
        search={search}
        setSearch={onChange}
      />
      <InteractionsFilters filters={filters} setFilters={updateFilters} />
      <InfiniteList<HmisNoteType>
        data={items}
        keyExtractor={(item) => item.id ?? ''}
        totalItems={total}
        renderItem={renderItemFn}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="note"
        error={!!error}
      />
    </MainScrollContainer>
  );
}
