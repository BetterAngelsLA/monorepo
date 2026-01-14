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
  FilterUsersDocument,
  FilterUsersQuery,
  FilterUsersQueryVariables,
} from './__generated__/filterUsers.generated';

type TUserResult = NonNullable<
  FilterUsersQuery['interactionAuthors']
>['results'][number];

type TProps = {
  onCommit: (selected: TFilterOption[]) => void;
  initialSelected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  currentUserId?: string;
  currentUserLabel?: string;
  valueKey?: keyof TFilterOption;
  labelKey?: keyof TFilterOption;
  style?: StyleProp<ViewStyle>;
};

export function FilterUserOptions(props: TProps) {
  const {
    onCommit,
    initialSelected = [],
    currentUserId,
    currentUserLabel = 'Me',
    searchPlaceholder,
    valueKey = 'id',
    labelKey = 'label',
  } = props;
  const [localSelected, setLocalSelected] =
    useState<TFilterOption[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, hasMore, error } =
    useInfiniteScrollQuery<
      TUserResult,
      FilterUsersQuery,
      FilterUsersQueryVariables
    >({
      document: FilterUsersDocument,
      queryFieldName: 'interactionAuthors',
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
    const optionList = items
      .filter((u) => {
        // this filter may be unnecessary
        if (!u.firstName && !u.lastName) {
          return false;
        }

        return searchQuery || currentUserId !== u.id;
      })
      .map((u) => ({
        id: u.id,
        label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      }));

    // add current user checkbox at top
    if (
      currentUserId &&
      !searchQuery &&
      optionList.length &&
      optionList[0].id !== currentUserId
    ) {
      optionList.unshift({
        id: currentUserId,
        label: currentUserLabel,
      });
    }

    return optionList;
  }, [items, searchQuery, currentUserId, currentUserLabel]);

  if (error) {
    console.error(error);

    return <TextRegular>Failed to load data</TextRegular>;
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
          modelName: 'author',
          estimatedItemSize: 48,
        }}
      />
    </Filters.Screen>
  );
}
