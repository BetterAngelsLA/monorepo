import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, useEffect, useState } from 'react';
import { FlatList, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { uniqueBy } from 'remeda';
import useDeepCompareEffect from 'use-deep-compare-effect';
import {
  ClientProfileFilter,
  ClientProfileOrder,
  InputMaybe,
} from '../../apollo';
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

  const renderFooter = () => {
    if (!loading) {
      return null;
    }

    return <ListLoadingView />;
  };

  // initial query hasn't run yet (clients undefined)
  if (!clients) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ClientProfileListHeader
        style={[styles.header, headerStyle]}
        totalClients={totalCount}
        visibleClients={clients.length}
        showAllClientsLink={showAllClientsLink}
        renderHeaderText={renderHeaderText}
      />

      <FlatList<TClientProfile>
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderItem(item)}
        onEndReached={loadMoreClients}
        onEndReachedThreshold={0.05}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        ListEmptyComponent={<ListEmptyState />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          !clients.length && styles.emptyContent,
          styles.listContent,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  header: {
    marginBottom: Spacings.xs,
  },
  listContent: {
    paddingBottom: 60,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
