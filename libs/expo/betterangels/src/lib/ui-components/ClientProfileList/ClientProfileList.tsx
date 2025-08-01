import { Spacings } from '@monorepo/expo/shared/static';
import { FlashList } from '@shopify/flash-list';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { uniqueBy } from 'remeda';
import useDeepCompareEffect from 'use-deep-compare-effect';
import {
  ClientProfileFilter,
  ClientProfileOrder,
  InputMaybe,
} from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { ClientProfileListHeader } from './ClientProfileListHeader';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import {
  ClientProfilesQuery,
  useClientProfilesQuery,
} from './__generated__/ClientProfiles.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';
import { ListHeaderProps } from './types';

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

type TProps = {
  renderItem: (clientProfile: TClientProfile) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<ClientProfileFilter>;
  order?: ClientProfileOrder | null;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: ListHeaderProps) => string;
  headerStyle?: ViewStyle;
  horizontalPadding?: number;
};

export function ClientProfileList(props: TProps) {
  const {
    filters,
    order = DEFAULT_QUERY_ORDER,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    renderHeaderText,
    headerStyle,
    showAllClientsLink,
    style,
    horizontalPadding = pagePaddingHorizontal,
  } = props;

  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<TClientProfile[] | undefined>(
    undefined
  );

  const { data, loading } = useClientProfilesQuery({
    variables: {
      filters,
      order,
      pagination: { limit: paginationLimit, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  // reset on actual filter value changes
  useDeepCompareEffect(() => {
    setOffset(0);
    setClients(undefined);
  }, [filters]);

  useEffect(() => {
    if (!data || !('clientProfiles' in data)) {
      return;
    }

    const { results, totalCount: newTotalCount } = data.clientProfiles;

    setTotalCount(newTotalCount);

    setClients((prevClients) => {
      if (offset === 0 || prevClients === undefined) {
        return results;
      }

      return uniqueBy([...prevClients, ...results], (client) => client.id);
    });

    setHasMore(offset + paginationLimit < newTotalCount);
  }, [data, offset]);

  function loadMoreClients() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const renderItemFn = useCallback(
    ({ item }: { item: TClientProfile }) => renderItem(item),
    [renderItem]
  );

  const renderFooter = () => {
    if (!loading) {
      return null;
    }

    return <ListLoadingView style={{ paddingVertical: 40 }} />;
  };

  // initial query hasn't run yet
  if (clients === undefined && loading) {
    return <ListLoadingView fullScreen={true} />;
  }

  if (!clients) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ClientProfileListHeader
        style={[
          styles.header,
          { paddingHorizontal: horizontalPadding },
          headerStyle,
        ]}
        totalClients={totalCount}
        visibleClients={clients.length}
        showAllClientsLink={showAllClientsLink}
        renderHeaderText={renderHeaderText}
      />

      <FlashList<TClientProfile>
        estimatedItemSize={95}
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={renderItemFn}
        onEndReached={loadMoreClients}
        onEndReachedThreshold={0.05}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        extraData={clients.length}
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
