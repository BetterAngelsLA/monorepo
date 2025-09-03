import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { FlashList } from '@shopify/flash-list';
import { ReactElement, ReactNode, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { InputMaybe, TaskFilter, TaskOrder } from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import { TaskListHeader } from './TaskListHeader';
import { TasksQuery, useTasksQuery } from './__generated__/Tasks.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';
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
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    style,
    horizontalPadding = pagePaddingHorizontal,
    headerStyle,
    renderHeaderText,
    actionItem,
  } = props;

  const { items, total, loading, loadMore, error } = useInfiniteScrollQuery<
    TTask,
    typeof useTasksQuery
  >({
    useQueryHook: useTasksQuery,
    queryFieldName: 'tasks',
    variables: {
      filters,
      ordering: order || undefined,
    },
    pageSize: paginationLimit,
    silencePolicyCheck: true,
  });

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
  if (items === undefined && loading) {
    return <ListLoadingView fullScreen={true} />;
  }

  if (error) {
    console.error(error);

    return (
      <TextRegular>
        Sorry, there was an error loading the task list.
      </TextRegular>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TaskListHeader
        actionItem={actionItem}
        style={[
          styles.header,
          { paddingHorizontal: horizontalPadding },
          headerStyle,
        ]}
        totalTasks={total}
        visibleTasks={items.length}
        renderHeaderText={renderHeaderText}
      />
      <FlashList<TTask>
        estimatedItemSize={95}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItemFn}
        onEndReached={loadMore}
        onEndReachedThreshold={0.05}
        // ItemSeparatorComponent renders only between items in a batch
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        // set extraData to force re-render when data is appended, else
        // newly loaded batch won't be separated by ItemSeparatorComponent
        extraData={items.length}
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
