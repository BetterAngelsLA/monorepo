import {
  MultiSelectInfinite,
  TFilterOption,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { usePaginatedQuery } from '../../../hooks';
import { useGetUsersQuery } from './__generated__/getUsers.generated';

type TProps = {
  onChange?: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  currentUserId?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const { currentUserId, style } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<TFilterOption[]>([]);
  const [selected, setSelected] = useState<TFilterOption[]>([]);

  const { items, total, isLoadingMore, loadMore, error } = usePaginatedQuery<
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

  useEffect(() => {
    const newOptions = items
      .filter((item) => (currentUserId ? item.id !== currentUserId : true))
      .map((item) => ({
        id: item.id,
        label: `${item.id} - ${item.firstName ?? ''} ${
          item.lastName ?? ''
        }`.trim(),
      }));

    setOptions(newOptions);
  }, [items.length, currentUserId]);

  if (error) {
    return (
      <TextRegular>
        {/* Failed to load users: {String((error as Error).message ?? error)} */}
        Failed to load users: {String(error)}
      </TextRegular>
    );
  }

  return (
    <View style={{ borderWidth: 4, borderColor: 'red', flex: 1 }}>
      <View
        style={{
          marginBottom: 16,
        }}
      >
        <TextRegular>
          Showing {options.length} out of {total}{' '}
        </TextRegular>
      </View>

      <MultiSelectInfinite<TFilterOption>
        serchPlaceholder="Search authors"
        title="Filter - Authors"
        searchDebounceMs={50}
        onSearch={setSearchQuery}
        onChange={(newSelected) => {
          setSelected(newSelected);
        }}
        options={options}
        selected={selected}
        loadMore={loadMore}
        isLoadingMore={isLoadingMore}
        valueKey="id"
        labelKey="label"
      />
    </View>
  );
}
