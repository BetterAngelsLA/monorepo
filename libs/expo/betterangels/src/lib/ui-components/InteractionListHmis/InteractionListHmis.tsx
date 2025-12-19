import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TRenderListResultsHeader,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  HmisNoteFilter,
  HmisNoteType,
  InputMaybe,
  NoteOrder,
} from '../../apollo';
import {
  InteractionListHmisDocument,
  InteractionListHmisQuery,
  InteractionListHmisQueryVariables,
} from './__generated__/interactionListHmis.generated';
import { DEFAULT_PAGINATION_LIMIT, DEFAULT_QUERY_ORDER } from './constants';

type TProps = {
  renderItem: (interaction: HmisNoteType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<HmisNoteFilter>;
  order?: NoteOrder | null;
  paginationLimit?: number;
  headerStyle?: ViewStyle;
  renderHeader?: TRenderListResultsHeader;
  actionItem?: ReactNode;
};

export function InteractionListHmis(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    itemGap,
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
    HmisNoteType,
    InteractionListHmisQuery,
    InteractionListHmisQueryVariables
  >({
    document: InteractionListHmisDocument,
    queryFieldName: 'hmisNotes',
    variables: {
      filters, // NoteFilter should be invalid; needs HmisNoteFilter?
      ordering: order || undefined,
    },
    pageSize: paginationLimit,
  });

  const renderItemFn = useCallback(
    (item: HmisNoteType) => renderItem(item),
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
      <InfiniteList<HmisNoteType>
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
