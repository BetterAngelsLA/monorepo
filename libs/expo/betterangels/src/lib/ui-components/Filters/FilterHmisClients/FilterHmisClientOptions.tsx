import { useInfiniteScrollQuery } from '@monorepo/apollo';
import {
  Filters,
  MultiSelect_V2,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { HmisClientProfileType, Ordering } from '../../../apollo';
import {
  FilterHmisClientProfilesDocument,
  FilterHmisClientProfilesQuery,
  FilterHmisClientProfilesQueryVariables,
} from './__generated__/filterHmisClientProfiles.generated';

export type TProps = {
  onCommit: (selected: TFilterOption[]) => void;
  initialSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  valueKey?: keyof TFilterOption;
  labelKey?: keyof TFilterOption;
  style?: StyleProp<ViewStyle>;
};

export function FilterHmisClientOptions(props: TProps) {
  const {
    onCommit,
    initialSelected = [],
    searchPlaceholder,
    valueKey = 'id',
    labelKey = 'label',
  } = props;
  const [localSelected, setLocalSelected] =
    useState<TFilterOption[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, hasMore, error } =
    useInfiniteScrollQuery<
      HmisClientProfileType,
      FilterHmisClientProfilesQuery,
      FilterHmisClientProfilesQueryVariables
    >({
      document: FilterHmisClientProfilesDocument,
      queryFieldName: 'hmisClientProfiles',
      variables: {
        ordering: {
          firstName: Ordering.AscNullsLast,
          lastName: Ordering.AscNullsLast,
          id: Ordering.Desc,
        },
        filters: {
          search: searchQuery,
        },
      },
    });

  const options = useMemo<TFilterOption[]>(() => {
    return items.map((u) => ({
      id: u.id,
      label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    }));
  }, [items]);

  if (error) {
    console.error(error);

    return <TextRegular>Failed to load client profiles</TextRegular>;
  }

  const handleDone = () => {
    onCommit(localSelected);
  };

  return (
    <Filters.Screen onDone={handleDone} onClear={() => setLocalSelected([])}>
      <MultiSelect_V2<TFilterOption>
        infinite
        options={options}
        onSearch={setSearchQuery}
        selected={localSelected}
        onChange={setLocalSelected}
        valueKey={valueKey}
        labelKey={labelKey}
        searchDebounceMs={250}
        searchPlaceholder={searchPlaceholder}
        infiniteProps={{
          loading,
          loadMore,
          hasMore,
          totalItems: total,
          modelName: 'client',
          estimatedItemSize: 49,
        }}
      />
    </Filters.Screen>
  );
}
