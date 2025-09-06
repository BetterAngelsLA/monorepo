import { Spacings } from '@monorepo/expo/shared/static';
import { MultiSelectNew } from '@monorepo/expo/shared/ui-components';
import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { uniqueBy } from 'remeda';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { InputMaybe, TaskFilter, TaskOrder } from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { TasksQuery, useTasksQuery } from './__generated__/Tasks.generated';
import { DEFAULT_ITEM_GAP, DEFAULT_QUERY_ORDER } from './constants';
import { ListHeaderProps } from './types';

type TTask = TasksQuery['tasks']['results'][number];

type TProps = {
  renderItem: (task: TTask) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<TaskFilter>;
  order?: TaskOrder | null;
  paginationLimit?: number;
  headerStyle?: ViewStyle;
  horizontalPadding?: number;
  renderHeaderText?: (props: ListHeaderProps) => string;
  actionItem?: ReactNode;
};

export function TaskList(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    itemGap = DEFAULT_ITEM_GAP,
    // paginationLimit = DEFAULT_PAGINATION_LIMIT,
    // paginationLimit = 10,
    paginationLimit = 100,
    renderItem,
    style,
    horizontalPadding = pagePaddingHorizontal,
    headerStyle,
    renderHeaderText,
    actionItem,
  } = props;

  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [tasks, setTasks] = useState<TTask[] | undefined>(undefined);

  const [selected, setSelected] = useState<TTask[]>([]);

  //

  const { data, loading } = useTasksQuery({
    variables: {
      filters,
      ordering: order || undefined,
      pagination: { limit: paginationLimit, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useDeepCompareEffect(() => {
    setOffset(0);
    setTasks(undefined);
  }, [filters]);

  useEffect(() => {
    if (!data || !('tasks' in data)) {
      return;
    }

    const { results, totalCount: newTotalCount } = data.tasks;

    setTotalCount(newTotalCount);

    setTasks((prevTasks) => {
      if (offset === 0 || prevTasks === undefined) {
        return results;
      }

      return uniqueBy([...prevTasks, ...results], (task) => task.id);
    });

    setHasMore(offset + paginationLimit < newTotalCount);
  }, [data, offset]);

  function loadMoreTasks() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const renderItemFn = useCallback(
    (item: TTask) => renderItem(item),
    [renderItem]
  );

  if (!tasks) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          borderWidth: 8,
          borderColor: 'blue',
        },
        style,
      ]}
    >
      {/* <TaskListHeader
        actionItem={actionItem}
        style={[styles.header, headerStyle]}
        totalTasks={totalCount}
        visibleTasks={tasks.length}
        renderHeaderText={renderHeaderText}
      />

      <InfiniteList<TTask>
        data={tasks}
        estimatedItemSize={259}
        idKey="id"
        renderItem={renderItemFn}
        loading={loading}
        loadMore={loadMoreTasks}
        hasMore={hasMore}
        itemGap={itemGap}
      /> */}
      <MultiSelectNew<TTask>
        mode="remote"
        searchDebounceMs={50}
        title="MultiSelectNew Title"
        itemGap={itemGap}
        options={tasks}
        estimatedItemSize={58}
        valueKey="id"
        labelKey="summary"
        selected={selected}
        onChange={setSelected}
        loading={loading}
        loadMore={loadMoreTasks}
        hasMore={hasMore}
        totalOptions={totalCount}
        onSearch={(query) => {
          console.log(
            '################################### SEARCH query: ',
            query
          );
        }}
      />

      {/* <MultiSelect
          style={{ borderWidth: 4, borderColor: 'red' }}
          filterPlaceholder="filter search"
          withFilter
          title="Multiselect Title"
          // search={searchQuery}
          // onSearch={onSearch}
          // onChange={onSelected}
          onChange={(newSelected) => {
            console.log(
              '################################### CHANGE: ',
              newSelected
            );
          }}
          // searchDebounceMs={searchDebounceMs}
          options={tasks.map((t) => {
            return {
              id: t.id,
              label: t.id,
            };
          })}
          // selected={selected}
          selected={[]}
          itemGap={itemGap}
          valueKey="id"
          labelKey="label"
        /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacings.xs,
  },
});
