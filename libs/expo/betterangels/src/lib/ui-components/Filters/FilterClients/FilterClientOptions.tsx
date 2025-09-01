import {
  Filters,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { usePaginatedQuery } from '../../../hooks';
// import { useGetUsersQuery } from './__generated__/getUsers.generated';
import { useFilterClientProfilesQuery } from './__generated__/filterClientProfiles.generated';

type TProps = {
  onSelected: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterClientOptions(props: TProps) {
  const { onSelected, selected = [] } = props;

  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, error } = usePaginatedQuery<
    ReturnType<typeof useFilterClientProfilesQuery> extends { data: infer D }
      ? D
      : never,
    { id: string; firstName?: string | null; lastName?: string | null },
    Parameters<typeof useFilterClientProfilesQuery>[0] extends {
      variables: infer V;
    }
      ? V
      : never
  >({
    useQueryHook: useFilterClientProfilesQuery as any,
    queryFieldName: 'clientProfiles',
    pageSize: 20,
    searchQuery,
  });

  // clientProfiles
  // "__typename": "ClientProfileTypeOffsetPaginated",
  // results
  // "__typename": "ClientProfileType",

  const options = useMemo<TFilterOption[]>(
    () =>
      items
        .filter((u) => !!u.firstName)
        .map((u) => ({
          id: u.id,
          label: `${u.id} - ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        })),
    [items]
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
      searchPlaceholder="Search Authors"
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
