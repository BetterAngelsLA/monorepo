import {
  Filters,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ordering } from '../../../apollo';
import { usePaginatedQuery } from '../../../hooks';
import {
  useGetUsersQuery,
  type GetUsersQuery,
} from './__generated__/getUsers.generated';

type TUserResult = NonNullable<
  GetUsersQuery['interactionAuthors']
>['results'][number];

type TProps = {
  onSelected: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  currentUserId?: string;
  currentUserLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUserOptions(props: TProps) {
  const {
    onSelected,
    selected = [],
    currentUserId,
    currentUserLabel = 'Me',
    searchPlaceholder,
  } = props;
  const [searchQuery, setSearchQuery] = useState('');

  const { items, total, loading, loadMore, error } = usePaginatedQuery<
    TUserResult,
    typeof useGetUsersQuery
  >({
    useQueryHook: useGetUsersQuery,
    queryFieldName: 'interactionAuthors',
    variables: {
      order: {
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
    const optionLisList = items
      .filter((u) => searchQuery || currentUserId !== u.id)
      .map((u) => ({
        id: u.id,
        label: `${u.id} - ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      }));

    if (currentUserId && !searchQuery) {
      optionLisList.unshift({
        id: currentUserId,
        label: currentUserLabel,
      });
    }

    return optionLisList;
  }, [items, currentUserId]);

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
