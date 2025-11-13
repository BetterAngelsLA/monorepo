import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TRenderListResultsHeader,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { InputMaybe, TaskFilter, TaskOrder } from '../../apollo';
import { ListLoadingView } from './ListLoadingView';
import {
  TasksDocument,
  TasksQuery,
  TasksQueryVariables,
} from './__generated__/Tasks.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';

type TTask = TasksQuery['tasks']['results'][number];

type TProps = {
  renderItem: (task: TTask) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<TaskFilter>;
  order?: TaskOrder | null;
  paginationLimit?: number;
  headerStyle?: ViewStyle;
  renderHeader?: TRenderListResultsHeader;
  actionItem?: ReactNode;
};

export function TaskList(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    renderHeader,
    style,
  } = props;

  const { items, total, loading, loadMore, hasMore, error } =
    useInfiniteScrollQuery<TTask, TasksQuery, TasksQueryVariables>({
      document: TasksDocument,
      queryFieldName: 'tasks',
      variables: {
        filters,
        ordering: order || undefined,
      },
      pageSize: paginationLimit,
    });

  const renderItemFn = useCallback(
    (item: TTask) => renderItem(item),
    [renderItem]
  );

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
      <InfiniteList<TTask>
        data={items}
        keyExtractor={(item) => item.id}
        totalItems={total}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="task"
        LoadingViewContent={<ListLoadingView style={{ paddingVertical: 40 }} />}
        renderResultsHeader={renderHeader}
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
});
