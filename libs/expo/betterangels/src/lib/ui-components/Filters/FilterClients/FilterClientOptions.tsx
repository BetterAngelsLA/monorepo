import {
  Filters,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { usePaginatedQuery } from '../../../hooks';
import {
  useFilterClientProfilesQuery,
  type FilterClientProfilesQuery,
} from './__generated__/filterClientProfiles.generated';

type TClientResult = NonNullable<
  FilterClientProfilesQuery['clientProfiles']
>['results'][number];

type TProps = {
  onSelected: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterClientOptions(props: TProps) {
  const { onSelected, selected = [], searchPlaceholder } = props;

  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, error } =
    usePaginatedQuery<TClientResult>({
      useQueryHook: useFilterClientProfilesQuery as any,
      queryFieldName: 'clientProfiles',
      pageSize: 20,
      searchQuery,
    });

  // clientProfiles
  // "__typename": "ClientProfileTypeOffsetPaginated",
  // results
  // "__typename": "ClientProfileType",

  console.log('*****************  items LEN:', items.length);

  const options = useMemo<TFilterOption[]>(
    () =>
      items
        .filter((u) => u.firstName || u.lastName)
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
