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
  HmisClientProfileType,
  InputMaybe,
} from '../../apollo';
import { ListLoadingView } from './ListLoadingView';
import {
  HmisClientProfilesDocument,
  HmisClientProfilesQuery,
  HmisClientProfilesQueryVariables,
} from './__generated__/HmisListClients.generated';
import { DEFAULT_ITEM_GAP, DEFAULT_PAGINATION_LIMIT } from './constants';

type TProps = {
  renderItem: (client: HmisClientProfileType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<HmisClientFilterInput>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: TRenderListResultsHeader) => string;
  headerStyle?: ViewStyle;
};

type THmisClientProfileResult =
  HmisClientProfilesQuery['hmisClientProfiles']['results'][number];

export function HmisListClients(props: TProps) {
  const {
    filters,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    style,
  } = props;
  const { items, total, loading, hasMore, loadMore, error } =
    useInfiniteScrollQuery<
      THmisClientProfileResult,
      HmisClientProfilesQuery,
      HmisClientProfilesQueryVariables
    >({
      document: HmisClientProfilesDocument,
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
        modelName="hmisClientProfile"
        data={items}
        keyExtractor={(item) => item.id!}
        totalItems={total}
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
