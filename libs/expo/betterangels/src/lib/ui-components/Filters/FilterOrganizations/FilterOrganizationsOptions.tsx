import { useInfiniteScrollQuery } from '@monorepo/apollo';
import {
  Filters,
  MultiSelect_V2,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ordering } from '../../../apollo';
import {
  FilterOrganizationsDocument,
  FilterOrganizationsQuery,
  FilterOrganizationsQueryVariables,
} from './__generated__/filterOrganizations.generated';

type TOrgResult = NonNullable<
  FilterOrganizationsQuery['caseworkerOrganizations']
>['results'][number];

export type TProps = {
  onCommit: (selected: TFilterOption[]) => void;
  initialSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  valueKey?: keyof TFilterOption;
  labelKey?: keyof TFilterOption;
  style?: StyleProp<ViewStyle>;
};

export function FilterOrganizationsOptions(props: TProps) {
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
      TOrgResult,
      FilterOrganizationsQuery,
      FilterOrganizationsQueryVariables
    >({
      document: FilterOrganizationsDocument,
      queryFieldName: 'caseworkerOrganizations',
      variables: {
        order: {
          name: Ordering.AscNullsLast,
          id: Ordering.Desc,
        },
        filters: {
          search: searchQuery,
        },
      },
    });

  const options = useMemo<TFilterOption[]>(() => {
    return items.map((item) => ({
      id: item.id,
      label: item.name,
    }));
  }, [items]);

  if (error) {
    console.error(error);

    return <TextRegular>Failed to load users</TextRegular>;
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
          modelName: 'organization',
          estimatedItemSize: 49,
        }}
      />
    </Filters.Screen>
  );
}
