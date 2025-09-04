import { Spacings } from '@monorepo/expo/shared/static';
import {
  ContentStyle,
  FlashList,
  type FlashListProps,
} from '@shopify/flash-list';
import { ReactElement, ReactNode, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { EmptyListView } from './EmptyListView';
import { ListLoadingView } from './ListLoadingView';

type TExtraFlashListProps<T> = Omit<
  Partial<FlashListProps<T>>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'ListEmptyComponent'
  | 'ListFooterComponent'
  | 'ItemSeparatorComponent'
  | 'contentContainerStyle' // use contentStyle instead
  | 'onEndReached'
  | 'onEndReachedThreshold'
  | 'extraData'
>;

type KeyOfType<T, V> = keyof {
  [K in keyof T as T[K] extends V | null | undefined ? K : never]: unknown;
};

export interface InfiniteListProps<
  T,
  K extends KeyOfType<T, string | number> = KeyOfType<T, string | number>
> extends TExtraFlashListProps<T> {
  style?: StyleProp<ViewStyle>;
  data: T[];
  idKey: K; // used as a stable key to extract, e.g. "id"
  renderItem: (item: T) => ReactElement | null;
  estimatedItemSize?: number; // rendering optimization. see console message if undefined
  loadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  itemGap?: number;
  ListEmptyComponent?: ReactElement | null;
  ListFooterComponent?: ReactElement | null;
  LoadingViewContent?: ReactNode | null;
  contentStyle?: ContentStyle;
  onEndReachedThreshold?: number;
  showScrollIndicator?: boolean;
}

export function InfiniteList<
  T,
  K extends KeyOfType<T, string | number> = KeyOfType<T, string | number>
>(props: InfiniteListProps<T, K>) {
  const {
    style,
    data,
    idKey,
    renderItem,
    loadMore,
    loading,
    hasMore,
    estimatedItemSize,
    ListEmptyComponent,
    ListFooterComponent,
    LoadingViewContent,
    contentStyle,
    onEndReachedThreshold = 0.05,
    itemGap = Spacings.xs,
    showScrollIndicator = false,
    ...rest
  } = props;

  const keyExtractor = useCallback((item: T) => String(item[idKey]), [idKey]);

  const renderItemWrapped = useCallback(
    ({ item }: { item: T }) => renderItem(item),
    [renderItem]
  );

  const onEndReached = useCallback(() => {
    if (!loading && hasMore && loadMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const Separator = useCallback(
    () => <View style={{ height: itemGap }} />,
    [itemGap]
  );

  const footerComponent =
    ListFooterComponent ??
    (loading ? (
      <ListLoadingView content={LoadingViewContent} />
    ) : (
      // small footer helps ensure there’s space to hit the end
      <View style={{ height: 16 }} />
    ));

  const emptyComponent = loading
    ? null
    : ListEmptyComponent ?? <EmptyListView />;

  const mergedContentContainerStyle: ContentStyle = StyleSheet.flatten([
    styles.contentContainer,
    contentStyle,
  ]);

  return (
    <FlashList<T>
      estimatedItemSize={estimatedItemSize}
      data={data as T[]}
      keyExtractor={keyExtractor}
      renderItem={renderItemWrapped}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ItemSeparatorComponent={Separator}
      // Ensures separators render correctly when data grows
      extraData={data.length}
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={footerComponent}
      contentContainerStyle={mergedContentContainerStyle}
      showsVerticalScrollIndicator={showScrollIndicator}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 60,
  },
});
