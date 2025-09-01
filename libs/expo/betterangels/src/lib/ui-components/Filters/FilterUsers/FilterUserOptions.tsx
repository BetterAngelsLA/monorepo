import {
  Filters,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { usePaginatedQuery } from '../../../hooks';
import { useGetUsersQuery } from './__generated__/getUsers.generated';

type TProps = {
  onSelected: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  currentUserId?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUserOptions(props: TProps) {
  const { onSelected, selected = [], currentUserId, searchPlaceholder } = props;

  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, error } = usePaginatedQuery<
    ReturnType<typeof useGetUsersQuery> extends { data: infer D } ? D : never,
    { id: string; firstName?: string | null; lastName?: string | null },
    Parameters<typeof useGetUsersQuery>[0] extends { variables: infer V }
      ? V
      : never
  >({
    useQueryHook: useGetUsersQuery as any,
    queryFieldName: 'interactionAuthors',
    pageSize: 20,
    searchQuery,
  });

  // interactionAuthors
  // "__typename": "InteractionAuthorTypeOffsetPaginated",
  // results
  // "__typename": "InteractionAuthorType",

  const options = useMemo<TFilterOption[]>(
    () =>
      items
        // .filter((u) => (currentUserId ? u.id !== currentUserId : true))
        .map((u) => ({
          id: u.id,
          label: `${u.id} - ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        })),
    [items, currentUserId]
  );

  if (error) {
    return (
      <TextRegular>
        {/* Failed to load users: {String((error as Error).message ?? error)} */}
        Failed to load users: {String(error)}
      </TextRegular>
    );
  }

  return (
    <Filters.Options
      type="infinite"
      searchPlaceholder={searchPlaceholder}
      searchDebounceMs={100}
      onSelected={onSelected}
      initialSelected={selected}
      loadMore={loadMore}
      loading={loading}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
      options={options}
      totalOptions={total}
    />
  );
}
