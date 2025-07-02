import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, useEffect, useState } from 'react';
import { FlatList, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

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

export type ListHeaderProps = {
  totalClients: number;
  visibleClients: number;
};

type TProps = {
  renderItem: (clientProfile: TClientProfile) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<ClientProfileFilter>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: ListHeaderProps) => string;
  headerStyle?: ViewStyle;
};

export function ClientProfileList(props: TProps) {
  const {
    filters,
    renderItem,
    style,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderHeaderText,
    headerStyle,
    showAllClientsLink,
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

  const renderFooter = () => {
    if (!loading) {
      return null;
    }

    const marginTop = clients?.length ? 10 : 45;

    return <ListLoadingView style={{ marginTop }} />;
  };

  // initial query hasn't run yet (clients undefined)
  if (!clients) {
    return;
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
    paddingBottom: 80,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
