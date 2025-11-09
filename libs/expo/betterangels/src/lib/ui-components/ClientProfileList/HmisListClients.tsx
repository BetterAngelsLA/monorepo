import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TRenderListResultsHeader,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  HmisClientFilterInput,
  HmisClientType,
  InputMaybe,
} from '../../apollo';
import { ListLoadingView } from './ListLoadingView';
import { useHmisListClientsQuery } from './__generated__/HmisListClients.generated';
import { DEFAULT_ITEM_GAP, DEFAULT_PAGINATION_LIMIT } from './constants';

type TProps = {
  renderItem: (client: HmisClientType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filter?: InputMaybe<HmisClientFilterInput>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: TRenderListResultsHeader) => string;
  headerStyle?: ViewStyle;
};

export function HmisListClients(props: TProps) {
  const {
    filter,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    style,
  } = props;

  const {
    items: clients,
    total: totalCount,
    loading,
    hasMore,
    loadMore,
    error,
  } = useInfiniteScrollQuery<HmisClientType, typeof useHmisListClientsQuery>({
    useQueryHook: useHmisListClientsQuery,
    queryFieldName: 'hmisListClients',
    pageSize: paginationLimit,
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  if (error) {
    console.error(error);
  }

  const renderItemFn = useCallback(
    (item: HmisClientType) => {
      return renderItem(item);
    },
    [renderItem]
  );

  if (clients.length === 0 && loading) {
    return <ListLoadingView fullScreen />;
  }

  return (
    <View style={[styles.container, style]}>
      <InfiniteList<HmisClientType>
        modelName="client"
        data={clients}
        keyExtractor={(item) => item.personalId!}
        totalItems={totalCount}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
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
