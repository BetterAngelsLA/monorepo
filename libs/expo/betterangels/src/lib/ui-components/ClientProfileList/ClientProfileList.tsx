import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { uniqueBy } from 'remeda';

import { ClientProfileFilter, InputMaybe } from '../../apollo';
import { ClientProfileListHeader } from './ClientProfileListHeader';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import {
  ClientProfilesQuery,
  useClientProfilesQuery,
} from './__generated__/ClientProfiles.generated';

const DEFAULT_PAGINATION_LIMIT = 20;
const DEFAULT_ITEM_GAP = 16;

type TClientProfile = ClientProfilesQuery['clientProfiles']['results'][number];

type TProps = {
  renderItem: (clientProfile: TClientProfile) => React.ReactElement | null;
  itemGap?: number;
  filters?: InputMaybe<ClientProfileFilter>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeader?: ({
    totalClients,
    visibleClients,
  }: {
    totalClients: number;
    visibleClients: number;
  }) => string;
};

export function ClientProfileList(props: TProps) {
  const {
    filters,
    renderItem,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderHeader,
    showAllClientsLink,
  } = props;

  console.log();
  console.log('| -------------  filters  ------------- |');
  console.log(filters);
  console.log();

  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<TClientProfile[] | undefined>(
    undefined
  );
  const { data, loading } = useClientProfilesQuery({
    variables: {
      filters,
      pagination: { limit: paginationLimit, offset: offset },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  async function loadMoreClients() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  useEffect(() => {
    if (!data || !('clientProfiles' in data)) {
      return;
    }

    const { results, totalCount } = data.clientProfiles;

    setTotalCount(totalCount);

    setClients((prevClients) => {
      if (offset === 0 || prevClients === undefined) {
        return results;
      }

      return uniqueBy([...prevClients, ...results], (client) => client.id);
    });

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  if (loading) {
    return <ListLoadingView />;
  }

  // initial query hasn't run yet (clients undefined)
  if (!clients) {
    return;
  }

  return (
    <FlatList<TClientProfile>
      style={styles.list}
      data={clients}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderItem(item)}
      ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
      onEndReached={loadMoreClients}
      onEndReachedThreshold={0.05}
      // header, footer etc...
      contentContainerStyle={!clients.length && styles.emptyContent}
      ListHeaderComponentStyle={{ borderWidth: 4, borderColor: 'blue' }}
      ListHeaderComponent={
        <ClientProfileListHeader
          totalClients={totalCount}
          visibleClients={clients.length}
          showAllClientsLink={showAllClientsLink}
          renderHeader={renderHeader}
          mb="xs"
        />
      }
      ListEmptyComponent={<ListEmptyState />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    paddingBottom: 80,
    marginTop: Spacings.xs,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
