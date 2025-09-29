import { Spacings } from '@monorepo/expo/shared/static';
import { FlashList } from '@shopify/flash-list';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { uniqueBy } from 'remeda';
import {
  HmisClientFilterInput,
  HmisClientListType,
  InputMaybe,
} from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { ClientProfileListHeader } from './ClientProfileListHeader';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import { useHmisListClientsQuery } from './__generated__/HmisListClients.generated';
import { DEFAULT_ITEM_GAP, DEFAULT_PAGINATION_LIMIT } from './constants';
import { ListHeaderProps } from './types';

type TClient = HmisClientListType['items'][number];

type TProps = {
  renderItem: (client: TClient) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filter?: InputMaybe<HmisClientFilterInput>;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: ListHeaderProps) => string;
  headerStyle?: ViewStyle;
  horizontalPadding?: number;
};

export function HmisListClients(props: TProps) {
  const {
    filter,
    itemGap = DEFAULT_ITEM_GAP,
    paginationLimit = DEFAULT_PAGINATION_LIMIT,
    renderItem,
    renderHeaderText,
    headerStyle,
    showAllClientsLink,
    style,
    horizontalPadding = pagePaddingHorizontal,
  } = props;

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [clients, setClients] = useState<TClient[] | undefined>(undefined);

  const { data, loading } = useHmisListClientsQuery({
    variables: { filter, pagination: { page, perPage: paginationLimit } },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    setPage(1);
    setClients(undefined);
    setHasMore(true);
    setTotalCount(0);
  }, [filter]);

  useEffect(() => {
    const res = data?.hmisListClients;
    if (!res) return;

    if (res.__typename === 'HmisClientListType') {
      const { items, meta } = res;

      setTotalCount(meta?.totalCount ?? 0);
      setHasMore((meta?.currentPage ?? 1) < (meta?.pageCount ?? 1));

      setClients((prev) => {
        if (page === 1 || !prev) return items;

        return uniqueBy(
          [...prev, ...items],
          (c) => c.uniqueIdentifier ?? c.personalId ?? ''
        );
      });
    } else if (res.__typename === 'HmisListClientsError') {
      setHasMore(false);
    }
  }, [data, page]);

  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  const renderItemFn = useCallback(
    ({ item }: { item: TClient }) => renderItem(item),
    [renderItem]
  );

  const renderFooter = () =>
    loading ? <ListLoadingView style={{ paddingVertical: 40 }} /> : null;

  if (clients === undefined && loading) {
    return <ListLoadingView fullScreen />;
  }

  if (!clients) return null;

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

      <FlashList<TClient>
        estimatedItemSize={95}
        data={clients}
        keyExtractor={(item) =>
          item.uniqueIdentifier ??
          item.personalId ??
          `${item.firstName ?? ''}-${item.lastName ?? ''}-${item.dob ?? ''}`
        }
        renderItem={renderItemFn}
        onEndReached={loadMore}
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
  container: { flex: 1 },
  header: { marginBottom: Spacings.xs },
  listContent: { paddingBottom: 60 },
});
