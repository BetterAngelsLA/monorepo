import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import { InfiniteList } from '@monorepo/expo/shared/ui-components';
import { ReactElement, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import {
  ClientProfileFilter,
  ClientProfileOrder,
  ClientProfileType,
  InputMaybe,
} from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { ClientProfileListHeader } from './ClientProfileListHeader';
import {
  ClientProfileListDocument,
  ClientProfileListQuery,
  ClientProfileListQueryVariables,
} from './__generated__/ClientProfileList.generated';
import {
  DEFAULT_ITEM_GAP,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_QUERY_ORDER,
} from './constants';
import { ListHeaderProps } from './types';

type TProps = {
  renderItem: (clientProfile: ClientProfileType) => ReactElement | null;
  style?: StyleProp<ViewStyle>;
  itemGap?: number;
  filters?: InputMaybe<ClientProfileFilter>;
  ordering?: ClientProfileOrder | ClientProfileOrder[] | null;
  paginationLimit?: number;
  showAllClientsLink?: boolean;
  renderHeaderText?: (props: ListHeaderProps) => string;
  headerStyle?: ViewStyle;
  horizontalPadding?: number;
};

export function ClientProfileList({
  filters,
  ordering = DEFAULT_QUERY_ORDER,
  itemGap = DEFAULT_ITEM_GAP,
  paginationLimit = DEFAULT_PAGINATION_LIMIT,
  renderItem,
  renderHeaderText,
  headerStyle,
  showAllClientsLink,
  style,
  horizontalPadding = pagePaddingHorizontal,
}: TProps) {
  const { items, total, loading, reloading, loadMore, reload, hasMore, error } =
    useInfiniteScrollQuery<
      ClientProfileType,
      ClientProfileListQuery,
      ClientProfileListQueryVariables
    >({
      document: ClientProfileListDocument,
      queryFieldName: 'clientProfiles',
      variables: { filters, ordering: ordering || undefined },
      pageSize: paginationLimit,
    });

  if (error) console.error(error);

  const renderItemFn = useCallback(
    (item: ClientProfileType) => renderItem(item),
    [renderItem]
  );

  return (
    <View style={[styles.container, style]}>
      <InfiniteList<ClientProfileType>
        data={items}
        keyExtractor={(item) => item.id}
        totalItems={total}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="client"
        renderResultsHeader={(visible, totalItems) => (
          <View
            style={[
              styles.headerWrap,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <ClientProfileListHeader
              style={headerStyle}
              totalClients={totalItems ?? 0}
              visibleClients={visible}
              showAllClientsLink={showAllClientsLink}
              renderHeaderText={renderHeaderText}
            />
          </View>
        )}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        onRefresh={reload}
        refreshing={reloading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { backgroundColor: 'transparent' },
  listContent: { paddingBottom: 60 },
  headerWrap: { marginBottom: Spacings.xs },
});
