import { Spacings } from '@monorepo/expo/shared/static';
import { FlashList } from '@shopify/flash-list';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { uniqueBy } from 'remeda';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { InputMaybe, TaskFilter, TaskOrder } from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { TasksQuery, useTasksQuery } from './__generated__/Tasks.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import { TaskListHeader } from './TaskListHeader';
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
};

export function TaskList(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    style,
    horizontalPadding = pagePaddingHorizontal,
    headerStyle,
    renderHeaderText,
  } = props;

  const [offset, setOffset] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [tasks, setTasks] = useState<TTask[] | undefined>(undefined);

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
    ({ item }: { item: TTask }) => renderItem(item),
    [renderItem]
  );

  const renderFooter = () => {
    if (!loading) {
      return null;
    }

    return <ListLoadingView style={{ paddingVertical: 40 }} />;
  };

  // initial query hasn't run yet
  if (tasks === undefined && loading) {
    return <ListLoadingView fullScreen={true} />;
  }

  if (!tasks) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TaskListHeader
        style={[
          styles.header,
          { paddingHorizontal: horizontalPadding },
          headerStyle,
        ]}
        totalTasks={totalCount}
        visibleTasks={tasks.length}
        renderHeaderText={renderHeaderText}
      />
      <FlashList<TTask>
        estimatedItemSize={95}
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItemFn}
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.05}
        // ItemSeparatorComponent renders only between items in a batch
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        // set extraData to force re-render when data is appended, else
        // newly loaded batch won't be separated by ItemSeparatorComponent
        extraData={tasks.length}
        ListEmptyComponent={<ListEmptyState />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: 60,
          paddingHorizontal: horizontalPadding,
        }}
      />
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
  listContent: {
    paddingBottom: 60,
  },
});
