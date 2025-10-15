import { useInfiniteScrollQuery } from '@monorepo/apollo';
import { Spacings } from '@monorepo/expo/shared/static';
import { InfiniteList } from '@monorepo/expo/shared/ui-components';
import { ReactElement, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import {
  ClientProfileFilter,
  ClientProfileOrder,
  InputMaybe,
} from '../../apollo';
import { pagePaddingHorizontal } from '../../static';
import { ClientProfileListHeader } from './ClientProfileListHeader';
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

export function ClientProfileList({
  filters,
  order = DEFAULT_QUERY_ORDER,
  itemGap = DEFAULT_ITEM_GAP,
  paginationLimit = DEFAULT_PAGINATION_LIMIT,
  renderItem,
  renderHeaderText,
  headerStyle,
  showAllClientsLink,
  style,
  horizontalPadding = pagePaddingHorizontal, // matches SearchBar in Clients page
}: TProps) {
  const { items, total, loading, loadMore, hasMore, error } =
    useInfiniteScrollQuery<TClientProfile, typeof useClientProfilesQuery>({
      useQueryHook: useClientProfilesQuery,
      queryFieldName: 'clientProfiles',
      variables: { filters, order: order || undefined },
      pageSize: paginationLimit,
    });

  if (error) console.error(error);

  const renderItemFn = useCallback(
    (item: TClientProfile) => renderItem(item),
    [renderItem]
  );

  return (
    <View style={[styles.container, style]}>
      <InfiniteList<TClientProfile>
        data={items}
        keyExtractor={(item) => item.id}
        totalItems={total}
        renderItem={renderItemFn}
        itemGap={itemGap}
        loading={loading}
        loadMore={loadMore}
        hasMore={hasMore}
        modelName="client"
        LoadingViewContent={<ListLoadingView style={{ paddingVertical: 40 }} />}
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
