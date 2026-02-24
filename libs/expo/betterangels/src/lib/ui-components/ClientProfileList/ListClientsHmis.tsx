import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  InfiniteList,
  TRenderListResultsHeader,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  HmisClientProfileFilter,
  HmisClientProfileType,
  InputMaybe,
} from '../../apollo';
import { ListLoadingView } from './ListLoadingView';
import {
  ClientProfilesHmisDocument,
  ClientProfilesHmisQuery,
  ClientProfilesHmisQueryVariables,
} from './__generated__/ListClientsHmis.generated';
import { DEFAULT_ITEM_GAP, DEFAULT_PAGINATION_LIMIT } from './constants';

type TProps = {
  renderItem: (client: HmisClientProfileType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<HmisClientProfileFilter>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: TRenderListResultsHeader) => string;
  headerStyle?: ViewStyle;
};

type TClientProfileResultHmis =
  ClientProfilesHmisQuery['hmisClientProfiles']['results'][number];

export function ListClientsHmis(props: TProps) {
  const {
    filters,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    style,
  } = props;
  const { items, total, loading, reloading, hasMore, loadMore, reload, error } =
    useInfiniteScrollQuery<
      TClientProfileResultHmis,
      ClientProfilesHmisQuery,
      ClientProfilesHmisQueryVariables
    >({
      document: ClientProfilesHmisDocument,
      queryFieldName: 'hmisClientProfiles',
      pageSize: paginationLimit,
      variables: { filters },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    });

  if (error) {
    console.error(error);
  }

  const renderItemFn = useCallback(
    (item: HmisClientProfileType) => {
      return renderItem(item);
    },
    [renderItem]
  );

  if (items.length === 0 && loading) {
    return <ListLoadingView fullScreen />;
  }

  return (
    <View style={[styles.container, style]}>
      <InfiniteList<HmisClientProfileType>
        modelName="client"
        data={items}
        keyExtractor={(item) => item.id!}
        totalItems={total}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
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
  listContent: {
    paddingBottom: 60,
  },
});
