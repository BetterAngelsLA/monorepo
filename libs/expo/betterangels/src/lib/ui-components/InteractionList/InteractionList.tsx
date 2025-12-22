import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TRenderListResultsHeader,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { InputMaybe, NoteFilter, NoteOrder, NoteType } from '../../apollo';
import {
  InteractionsDocument,
  InteractionsQuery,
  InteractionsQueryVariables,
} from './__generated__/Interactions.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';

type TProps = {
  renderItem: (interaction: NoteType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<NoteFilter>;
  order?: NoteOrder | NoteOrder[] | null;
  paginationLimit?: number;
  headerStyle?: ViewStyle;
  renderHeader?: TRenderListResultsHeader;
  actionItem?: ReactNode;
};

export function InteractionList(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    renderHeader,
    style,
  } = props;

  const {
    items,
    total,
    loading,
    loadingMore,
    reloading,
    loadMore,
    reload,
    hasMore,
    error,
  } = useInfiniteScrollQuery<
    NoteType,
    InteractionsQuery,
    InteractionsQueryVariables
  >({
    document: InteractionsDocument,
    queryFieldName: 'notes',
    variables: {
      filters,
      ordering: order || undefined,
    },
    pageSize: paginationLimit,
  });

  const renderItemFn = useCallback(
    (item: NoteType) => renderItem(item),
    [renderItem]
  );

  if (error) {
    console.error(error);

    return (
      <TextRegular>
        Sorry, there was an error loading the interaction list.
      </TextRegular>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <InfiniteList<NoteType>
        data={items}
        keyExtractor={(item) => item.id}
        totalItems={total}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadingMore={loadingMore}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="interaction"
        renderResultsHeader={renderHeader}
        onRefresh={reload}
        refreshing={reloading}
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
